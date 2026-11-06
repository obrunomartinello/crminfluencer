const express = require('express')
const assert = require('assert')

async function runRoutesTest() {
  console.log('--- TEST: v2.0 Express Routes (Publicidades, Metas, Profile, Games) ---')
  const app = express()
  app.use(express.json())

  app.use('/api/influencers', require('../server/routes/influencers'))
  app.use('/api/publicidades', require('../server/routes/publicidades'))
  app.use('/api/metas', require('../server/routes/metas'))
  app.use('/api/import', require('../server/routes/import'))
  app.get('/api/games', (req, res) => {
    const store = require('../server/db/store')
    res.json({ games: store.listGames() })
  })

  const server = app.listen(3098)
  const base = 'http://127.0.0.1:3098/api'

  try {
    // 1. Games
    console.log('1. Testing GET /api/games...')
    const resGames = await fetch(`${base}/games`)
    const dataGames = await resGames.json()
    assert.strictEqual(dataGames.games.length, 4)
    assert.ok(dataGames.games.includes('Block Win'))
    console.log('✅ /api/games: ok')

    // 2. Publicidades
    console.log('2. Testing GET /api/publicidades & stats...')
    const resPublis = await fetch(`${base}/publicidades`)
    const dataPublis = await resPublis.json()
    assert.strictEqual(dataPublis.total, 18, 'Should have 18 publicidades')

    const resStats = await fetch(`${base}/publicidades/stats`)
    const dataStats = await resStats.json()
    console.log('Publicidades Stats:', dataStats)
    assert.ok(dataStats.totalInvested >= 4000, 'Invested should be >= 4000')
    console.log('✅ /api/publicidades: ok')

    // 3. Metas & Increment
    console.log('3. Testing GET /api/metas & increment...')
    const resMetas = await fetch(`${base}/metas`)
    const dataMetas = await resMetas.json()
    assert.strictEqual(dataMetas.total, 11, 'Should have 11 metas')

    const targetMetaId = dataMetas.data[0].id
    const prevReached = dataMetas.data[0].reached_depositors
    const resInc = await fetch(`${base}/metas/${targetMetaId}/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2 }),
    })
    const dataInc = await resInc.json()
    assert.strictEqual(dataInc.data.reached_depositors, prevReached + 2)
    console.log('✅ /api/metas increment: ok')

    // 4. Perfil Unificado
    console.log('4. Testing GET /api/influencers/profile/eugael...')
    const resProfile = await fetch(`${base}/influencers/profile/eugael`)
    const dataProfile = await resProfile.json()
    assert.strictEqual(dataProfile.influencer.username, 'eugael')
    assert.ok(dataProfile.publicidades.length >= 2, 'Gael should have at least 2 publicidades')
    assert.ok(dataProfile.metas.length >= 1, 'Gael should have at least 1 meta')
    console.log('Gael unified profile:', {
      name: dataProfile.influencer.full_name,
      ads: dataProfile.publicidades.length,
      metas: dataProfile.metas.length,
      invested: dataProfile.metrics.totalInvested,
    })
    console.log('✅ /api/influencers/profile/:username: ok')

    console.log('\n🎉 ALL V2.0 BACKEND ROUTE TESTS PASSED!')
  } finally {
    server.close()
  }
}

runRoutesTest().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
