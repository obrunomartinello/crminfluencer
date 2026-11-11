require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const assert = require('assert')
const express = require('express')

async function runSearchV2Tests() {
  console.log('=== RED/GREEN TEST SUITE: Search Engine v2.1 & CRM Sorting ===\n')

  // 1. Test buildSearchInput uses searchLimit (not resultsLimit) & liveSearch
  const apify = require('../server/services/apify')
  assert.strictEqual(typeof apify.buildSearchInput, 'function', 'buildSearchInput must be exported from apify.js')

  const popularInput = apify.buildSearchInput('humor nordestino', 25, 'popular')
  assert.strictEqual(popularInput.search, 'humor nordestino')
  assert.strictEqual(popularInput.searchType, 'popular')
  assert.strictEqual(popularInput.searchLimit, 25, 'Must use searchLimit (not resultsLimit)')
  assert.strictEqual(popularInput.resultsLimit, undefined, 'Must NOT pass deprecated resultsLimit')

  const userInput = apify.buildSearchInput('@sinuca brasil', 15, 'user')
  assert.strictEqual(userInput.search, 'sinuca brasil')
  assert.strictEqual(userInput.searchType, 'user')
  assert.strictEqual(userInput.searchLimit, 15)
  assert.strictEqual(userInput.liveSearch, true, 'User search must enable liveSearch: true')
  console.log('✅ 1. buildSearchInput contract passed')

  // 2. Test extractCreatorsFromSearchItems (Popular Reels + Coauthors + Exclusions)
  assert.strictEqual(typeof apify.extractCreatorsFromSearchItems, 'function', 'extractCreatorsFromSearchItems must be exported')
  const sampleReels = [
    {
      ownerUsername: 'criador_sertanejo',
      ownerFullName: 'Zé do Sertão',
      videoPlayCount: 120000,
      likesCount: 9500,
      commentsCount: 320,
      caption: 'Humor da roça #nordeste',
      coauthorProducers: [
        { username: 'parceiro_humor', full_name: 'Parceiro Humor', profile_pic_url: 'https://img/1.jpg' },
      ],
    },
    {
      ownerUsername: 'criador_sertanejo',
      ownerFullName: 'Zé do Sertão',
      videoPlayCount: 80000,
      likesCount: 5000,
      commentsCount: 150,
      caption: 'Parte 2 da resenha',
    },
    {
      ownerUsername: 'ja_no_crm',
      ownerFullName: 'Lead Antigo',
      videoPlayCount: 50000,
      likesCount: 2000,
    },
  ]

  const extracted = apify.extractCreatorsFromSearchItems(sampleReels, 'popular', new Set(['ja_no_crm']))
  assert.ok(extracted.freshUsernames.includes('criador_sertanejo'), 'Should include main ownerUsername')
  assert.ok(extracted.freshUsernames.includes('parceiro_humor'), 'Should include coauthorProducers')
  assert.ok(!extracted.freshUsernames.includes('ja_no_crm'), 'Should exclude already known CRM usernames from freshUsernames')
  assert.strictEqual(extracted.metaByUsername.criador_sertanejo.reelViews.length, 2, 'Should aggregate multiple reels of same creator')
  console.log('✅ 2. extractCreatorsFromSearchItems contract passed')

  // 3. Test Stateless Job Token encode/decode
  const mineRoute = require('../server/routes/mine')
  assert.strictEqual(typeof mineRoute.encodeJobToken, 'function', 'encodeJobToken must be exported from mine.js')
  assert.strictEqual(typeof mineRoute.decodeJobToken, 'function', 'decodeJobToken must be exported from mine.js')

  const payload = { s: 1, q: 'sinuca', c: 20, m: 'popular', r: [{ id: 'run1', ds: 'ds1' }] }
  const token = mineRoute.encodeJobToken(payload)
  const decoded = mineRoute.decodeJobToken(token)
  assert.deepStrictEqual(decoded, payload)
  console.log('✅ 3. Stateless job token encode/decode passed')

  // 4. Test store.listInfluencers sorting (recent puts new mined leads on Page 1) & extended search
  process.env.SKIP_SUPABASE_WRITE = 'true'
  const store = require('../server/db/store')
  const testUsername = `criador_novo_teste_${Date.now()}`
  await store.upsertInfluencer({
    username: testUsername,
    full_name: 'Fulano Teste Recente',
    bio: 'Criador de humor nordestino raiz e vaquejada',
    niche: 'Humor Regional',
    followers_count: 25000,
    avg_reels_views: 15000,
    score: 52, // Lower than seeded 95!
    classification: 'PRATA',
    source_query: 'humor nordestino',
  })

  const recentPage1 = await store.listInfluencers({ sortBy: 'recent', page: 1, limit: 15 })
  assert.strictEqual(recentPage1.data[0].username, testUsername, 'Newly mined lead with score 52 MUST be first on Page 1 when sortBy=recent')

  // Extended search across bio/niche/source_query
  const bioSearch = await store.listInfluencers({ search: 'vaquejada', page: 1, limit: 20 })
  assert.ok(bioSearch.data.some(i => i.username === testUsername), 'Search must match bio and niche, not just username')

  // Preserve Pedro status on re-upsert
  await store.upsertInfluencer({
    username: 'eugael',
    followers_count: 99000,
    bio: 'Bio atualizada pelo scraper',
  })
  const gaelProfile = await store.getInfluencerFullProfile('eugael')
  assert.strictEqual(gaelProfile.influencer.status, 'Fechou', 'Re-upserting existing lead must NOT overwrite status Fechou')
  console.log('✅ 4. Store sorting, bio search, and status preservation passed')

  // 5. Test PUT /api/influencers/:id accepts Pedro statuses (Fechou, Em negociação, etc.)
  const app = express()
  app.use(express.json())
  app.use('/api/influencers', require('../server/routes/influencers'))
  const server = app.listen(3097)
  try {
    const resPut = await fetch(`http://127.0.0.1:3097/api/influencers/${testUsername}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Em negociação' }),
    })
    assert.strictEqual(resPut.status, 200, 'PUT should accept Pedro status "Em negociação"')
    const putData = await resPut.json()
    assert.strictEqual(putData.data.status, 'Em negociação')
    console.log('✅ 5. Influencer PUT status validation passed for Pedro statuses')
  } finally {
    server.close()
  }

  console.log('\n🎉 ALL SEARCH V2.1 TESTS PASSED!')
}

runSearchV2Tests().catch(err => {
  console.error('❌ Test failed:', err.message || err)
  process.exit(1)
})
