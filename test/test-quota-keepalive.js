require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const express = require('express')
const assert = require('assert')

const apify = require('../server/services/apify')
const store = require('../server/db/store')

async function runTests() {
  console.log('--- TEST: Apify Quota Thermometer & Supabase Keepalive ---')

  // 1. Unit tests for apify.getQuotaStatus with mock client
  assert.strictEqual(typeof apify.getQuotaStatus, 'function', 'apify.getQuotaStatus must exist')
  assert.strictEqual(typeof apify.clearQuotaCache, 'function', 'apify.clearQuotaCache must exist')

  let limitsCalls = 0
  let userCalls = 0
  const makeMockClient = (usedUsd, maxUsd = 5) => ({
    user: () => ({
      limits: async () => {
        limitsCalls++
        return {
          monthlyUsageCycle: {
            startAt: '2026-10-15T00:00:00.000Z',
            endAt: '2026-11-14T23:59:59.999Z',
          },
          limits: { maxMonthlyUsageUsd: maxUsd },
          current: { monthlyUsageUsd: usedUsd },
        }
      },
      get: async () => {
        userCalls++
        return {
          username: 'pedrao_venvas',
          plan: { id: 'FREE', maxMonthlyUsageUsd: maxUsd, monthlyUsageCreditsUsd: maxUsd },
        }
      },
    }),
  })

  apify.clearQuotaCache()
  const healthyQuota = await apify.getQuotaStatus({ client: makeMockClient(0.5, 5) })
  assert.strictEqual(healthyQuota.configured, true)
  assert.strictEqual(healthyQuota.plan, 'FREE')
  assert.strictEqual(healthyQuota.limitUsd, 5)
  assert.strictEqual(healthyQuota.usedUsd, 0.5)
  assert.strictEqual(healthyQuota.remainingUsd, 4.5)
  assert.strictEqual(healthyQuota.percentUsed, 10)
  assert.strictEqual(healthyQuota.percentRemaining, 90)
  assert.strictEqual(healthyQuota.level, 'healthy')
  assert.ok(healthyQuota.estimatedSearchesLeft >= 70, 'expected >= 70 estimated searches left')
  assert.strictEqual(healthyQuota.cycleEndAt, '2026-11-14T23:59:59.999Z')

  // Cache hit check (no extra API calls)
  await apify.getQuotaStatus({ client: makeMockClient(4.2, 5) })
  assert.strictEqual(limitsCalls, 1, 'cached quota should avoid redundant Apify API call')

  // forceRefresh bypasses cache + warning level test
  const warningQuota = await apify.getQuotaStatus({ client: makeMockClient(3.6, 5), forceRefresh: true })
  assert.strictEqual(limitsCalls, 2)
  assert.strictEqual(warningQuota.remainingUsd, 1.4)
  assert.strictEqual(warningQuota.level, 'warning')

  // Critical level test
  const criticalQuota = await apify.getQuotaStatus({ client: makeMockClient(4.6, 5), forceRefresh: true })
  assert.strictEqual(criticalQuota.remainingUsd, 0.4)
  assert.strictEqual(criticalQuota.level, 'critical')

  // Unconfigured token fallback
  const unconfigured = await apify.getQuotaStatus({ token: '', forceRefresh: true })
  assert.strictEqual(unconfigured.configured, false)
  assert.strictEqual(unconfigured.remainingUsd, 0)

  console.log('✅ 1. Unit tests for getQuotaStatus passed')

  // 2. Express route GET /api/mine/quota (using live APIFY_TOKEN if configured)
  apify.clearQuotaCache()
  const app = express()
  app.use(express.json())
  app.use('/api/mine', require('../server/routes/mine'))

  const server = app.listen(3097)
  try {
    const res = await fetch('http://127.0.0.1:3097/api/mine/quota')
    assert.strictEqual(res.status, 200, 'GET /api/mine/quota should return 200')
    const data = await res.json()
    console.log('Live /api/mine/quota response:', data)
    assert.strictEqual(typeof data.limitUsd, 'number')
    assert.strictEqual(typeof data.usedUsd, 'number')
    assert.strictEqual(typeof data.remainingUsd, 'number')
    assert.strictEqual(typeof data.percentRemaining, 'number')
    assert.strictEqual(typeof data.estimatedSearchesLeft, 'number')
    assert.ok(['healthy', 'warning', 'critical'].includes(data.level))
    assert.ok(!JSON.stringify(data).includes('apify_api_'), 'must never leak raw Apify token')
  } finally {
    server.close()
  }
  console.log('✅ 2. GET /api/mine/quota route test passed')

  // 3. Supabase live keepalive check via store.checkSupabaseHealth()
  const health = await store.checkSupabaseHealth()
  console.log('Supabase health check:', health)
  assert.strictEqual(health.configured, true, 'Supabase should be configured in .env')
  assert.strictEqual(typeof health.online, 'boolean')
  assert.ok(health.lastPingAt, 'checkSupabaseHealth must return lastPingAt ISO timestamp')
  if (health.online) {
    assert.strictEqual(typeof health.latencyMs, 'number', 'online ping must include latencyMs')
  }
  console.log('✅ 3. Supabase keepalive check test passed')

  // 4. Express server /api/health & /api/cron/keepalive endpoints
  const mainApp = require('../server/index')
  const mainServer = mainApp.listen(3096)
  try {
    for (const path of ['/api/health', '/api/cron/keepalive']) {
      const hRes = await fetch(`http://127.0.0.1:3096${path}`)
      assert.strictEqual(hRes.status, 200, `${path} must return 200`)
      assert.ok((hRes.headers.get('cache-control') || '').includes('no-store'), `${path} must disable CDN caching`)
      const hData = await hRes.json()
      assert.strictEqual(hData.ok, true)
      assert.strictEqual(hData.keepalive, true)
      assert.strictEqual(hData.supabase.configured, true)
    }
  } finally {
    mainServer.close()
  }
  console.log('✅ 4. /api/health and /api/cron/keepalive routes passed')

  console.log('\n🎉 ALL QUOTA & KEEPALIVE TESTS PASSED!')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
