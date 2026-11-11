require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const assert = require('assert')
const express = require('express')

async function runSupabaseAndEndpointsBattery() {
  console.log('=== BATTERY TEST: Supabase Persistence, Mined Tracking & All Routes ===\n')
  delete process.env.SKIP_SUPABASE_WRITE

  const storePath = require.resolve('../server/db/store')
  let store = require(storePath)

  // 1. Hydratation on boot: should load 99 seed + real Supabase rows
  await store.ensureInitialized()
  const statsBoot = await store.getStats()
  console.log('Boot stats:', {
    total: statsBoot.total,
    minedCount: statsBoot.minedCount,
    minedAwaitingCount: statsBoot.minedAwaitingCount,
    minedMovedCount: statsBoot.minedMovedCount,
    supabase: store.getSupabaseStatus(),
  })
  assert.ok(statsBoot.total >= 99, 'Should include at least Pedro 99 seed rows')
  assert.ok(statsBoot.minedCount >= 7, 'Should hydrate existing live Supabase mined rows (>= 7)')

  const minedList = await store.listInfluencers({ stage: 'mined', sortBy: 'recent', limit: 50 })
  assert.ok(minedList.data.length >= 7, 'stage=mined should return hydrated Supabase leads')
  console.log('✅ 1. Supabase cold boot hydration & stage=mined query passed')

  // 2. Real Supabase Roundtrip Persistence (Create via Mining -> Update SDR -> Reload Store -> Verify -> Delete)
  const testUser = `teste_persist_${Date.now()}`
  let createdInSupabase = false
  try {
    const upserted = await store.upsertInfluencer({
      username: testUser,
      full_name: 'Criador Teste Persistencia',
      bio: 'Teste automático Supabase Jackpot CRM',
      niche: 'Sinuca & Bar',
      followers_count: 25000,
      avg_reels_views: 11000,
      source_query: 'sinuca teste real',
      user_notes: 'Nota limpa do usuario',
    })
    assert.ok(upserted?.record?.id, 'upsertInfluencer must return record')
    createdInSupabase = true

    // Simulate moving from Minerados -> Para Abordar -> Msg Enviada + Dados Ficha
    const updated = await store.updateInfluencer(testUser, {
      status: 'Mensagem Enviada',
      outreach_channel: 'whatsapp',
      whatsapp: '5511988887777',
      campaign_game: 'Block Win',
      story_views_avg: 3200,
      story_asking_price: 450,
    })
    assert.strictEqual(updated.status, 'Mensagem Enviada')
    assert.strictEqual(updated.outreach_channel, 'whatsapp')
    assert.ok(updated.contacted_at, 'contacted_at must be stamped')

    // Simulate full server restart by clearing require cache of store.js
    delete require.cache[storePath]
    store = require(storePath)
    await store.ensureInitialized()

    const reloaded = await store.listInfluencers({ stage: 'mined', search: testUser, limit: 10 })
    const match = reloaded.data.find((i) => i.username === testUser)
    assert.ok(match, 'Persisted lead MUST survive full store cache reload from Supabase!')
    assert.strictEqual(match.status, 'Mensagem Enviada', 'Status must survive Supabase reload')
    assert.strictEqual(match.outreach_channel, 'whatsapp', 'outreach_channel must survive Supabase reload')
    assert.strictEqual(match.source_query, 'sinuca teste real', 'source_query must survive Supabase reload')
    assert.strictEqual(match.campaign_game, 'Block Win', 'campaign_game must survive Supabase reload')
    assert.strictEqual(match.story_views_avg, 3200, 'story_views_avg must survive Supabase reload')
    assert.strictEqual(match.story_asking_price, 450, 'story_asking_price must survive Supabase reload')
    assert.strictEqual(match.user_notes, 'Nota limpa do usuario', 'user_notes must remain clean (no leaked [CRM_META])')
    assert.ok(match.last_mined_at, 'last_mined_at must survive Supabase reload')
    assert.ok(match.contacted_at, 'contacted_at must survive Supabase reload')
    console.log('✅ 2. Real Supabase create -> update -> cold restart reload persistence passed')
  } finally {
    if (createdInSupabase) {
      const deleted = await store.deleteInfluencer(testUser)
      assert.strictEqual(deleted, true, 'deleteInfluencer must clean up synthetic test lead')
      delete require.cache[storePath]
      store = require(storePath)
      await store.ensureInitialized()
      const afterDel = await store.listInfluencers({ search: testUser, limit: 10 })
      assert.strictEqual(afterDel.data.some((i) => i.username === testUser), false, 'Deleted lead must also be deleted from Supabase!')
      console.log('✅ 3. Real Supabase delete & cleanup verification passed')
    }
  }

  // 3. Full HTTP Battery across all operational endpoints (isolated from mutating publicidades/metas seed)
  process.env.SKIP_SUPABASE_WRITE = 'true'
  const app = express()
  app.use(express.json())
  app.use('/api/influencers', require('../server/routes/influencers'))
  app.use('/api/publicidades', require('../server/routes/publicidades'))
  app.use('/api/metas', require('../server/routes/metas'))
  app.use('/api/import', require('../server/routes/import'))

  const server = app.listen(3094)
  const base = 'http://127.0.0.1:3094/api'
  try {
    // Publicidade CRUD + Auto-Meta creation
    const createPub = await fetch(`${base}/publicidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        influencer_username: 'criador_pub_teste',
        influencer_name: 'Criador Pub Teste',
        game: 'Block Win',
        invested_amount: 500,
        return_amount: 1200,
        closure_type: 'Por meta',
        target_depositors: 25,
        delivery_status: 'Agendada',
        payment_status: 'Pendente',
      }),
    })
    assert.strictEqual(createPub.status, 201)
    const { data: pub } = await createPub.json()
    assert.strictEqual(pub.total_cost, 500)
    assert.ok(pub.roi > 1, 'ROI for 500 invested / 1200 return should be 1.4')

    const editPub = await fetch(`${base}/publicidades/${pub.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'Pago', delivery_status: 'Postada' }),
    })
    assert.strictEqual(editPub.status, 200)
    const { data: editedPub } = await editPub.json()
    assert.strictEqual(editedPub.payment_status, 'Pago')

    // Meta auto-created by "Por meta" publicidade + increment
    const metasRes = await fetch(`${base}/metas`)
    const { data: metas } = await metasRes.json()
    const linkedMeta = metas.find((m) => m.influencer_username === 'criador_pub_teste')
    assert.ok(linkedMeta, 'Por meta publicidade must auto-create linked Meta')

    const incRes = await fetch(`${base}/metas/${linkedMeta.id}/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 25 }),
    })
    assert.strictEqual(incRes.status, 200)
    const { data: updatedMeta } = await incRes.json()
    assert.strictEqual(updatedMeta.reached_depositors, 25)
    assert.strictEqual(updatedMeta.status, 'Meta atingida')

    const delPub = await fetch(`${base}/publicidades/${pub.id}`, { method: 'DELETE' })
    assert.strictEqual(delPub.status, 200)

    // Import Preview
    const prevRes = await fetch(`${base}/import/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'captacao',
        rows: [{ '@ Instagram': '@criador_planilha', Seguidores: '45k', WhatsApp: '11999998888' }],
      }),
    })
    assert.strictEqual(prevRes.status, 200)
    const prevData = await prevRes.json()
    assert.strictEqual(prevData.validCount, 1)
    assert.strictEqual(prevData.preview[0].username, 'criador_planilha')

    console.log('✅ 4. Full HTTP CRUD battery (Publicidades + Metas + Increment + Import Preview) passed')
  } finally {
    server.close()
  }

  console.log('\n🎉 ALL SUPABASE & BUTTON/ENDPOINT BATTERY TESTS PASSED!')
}

runSupabaseAndEndpointsBattery().catch((err) => {
  console.error('❌ Battery test failed:', err)
  process.exit(1)
})
