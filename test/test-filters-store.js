require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const assert = require('assert')
const store = require('../server/db/store')

async function runFilterTests() {
  console.log('--- TEST: In-CRM SDR Filters (minFollowers, hideAgencies, etc.) ---')

  // 1. Listar todos
  const all = await store.listInfluencers({ page: 1, limit: 100 })
  console.log('Total influencers in store:', all.total)
  assert.ok(all.total > 0, 'Store should have influencers')

  // 2. Testar filtro de 15k+ seguidores
  const min15k = await store.listInfluencers({ minFollowers: 15000, page: 1, limit: 100 })
  console.log('Total with 15k+ followers:', min15k.total)
  for (const inf of min15k.data) {
    assert.ok(inf.followers_count >= 15000, `Influencer ${inf.username} has ${inf.followers_count} (< 15000)`)
  }
  console.log('✅ minFollowers filter verified successfully')

  // 3. Testar filtro hideAgencies
  const noAgencies = await store.listInfluencers({ hideAgencies: true, page: 1, limit: 100 })
  console.log('Total without agencies:', noAgencies.total)
  for (const inf of noAgencies.data) {
    assert.strictEqual(inf.is_agency, false, `Influencer ${inf.username} should not be an agency`)
  }
  console.log('✅ hideAgencies filter verified successfully')

  // 4. Testar combinação de filtros (15k+ AND sem agência)
  const combined = await store.listInfluencers({ minFollowers: 15000, hideAgencies: true, page: 1, limit: 100 })
  console.log('Total combined (15k+ & No Agency):', combined.total)
  for (const inf of combined.data) {
    assert.ok(inf.followers_count >= 15000)
    assert.strictEqual(inf.is_agency, false)
  }
  console.log('✅ Combined filters verified successfully')

  console.log('\n🎉 ALL SDR FILTER TESTS PASSED!')
}

runFilterTests().catch((err) => {
  console.error('❌ Filter test failed:', err)
  process.exit(1)
})
