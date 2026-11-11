require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const assert = require('assert')
const express = require('express')

async function runV3WorkflowTests() {
  console.log('=== RED/GREEN TEST SUITE: Scout CRM v3.0 SDR Workflow ===\n')
  process.env.SKIP_SUPABASE_WRITE = 'true'

  const store = require('../server/db/store')
  const app = express()
  app.use(express.json())
  app.use('/api/influencers', require('../server/routes/influencers'))

  const server = app.listen(3095)
  const baseUrl = 'http://127.0.0.1:3095/api/influencers'

  try {
    // 1. Seed a brand-new untouched lead ("Novo")
    const uniqueUsername = `sdr_lead_teste_${Date.now()}`
    const createRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUsername,
        full_name: 'Criador Para Abordar',
        followers_count: 32000,
        avg_reels_views: 14000,
        status: 'Novo',
      }),
    })
    assert.strictEqual(createRes.status, 201, 'POST /api/influencers should create lead')
    const { data: created } = await createRes.json()
    assert.strictEqual(created.status, 'Novo')

    // 2. Verify stage=to_contact includes Novo and stage=sent excludes Novo
    const toContactRes = await fetch(`${baseUrl}?stage=to_contact&search=${uniqueUsername}`)
    const toContactData = await toContactRes.json()
    assert.ok(
      toContactData.data.some(i => i.username === uniqueUsername),
      'stage=to_contact must include Novo lead'
    )

    const sentBeforeRes = await fetch(`${baseUrl}?stage=sent&search=${uniqueUsername}`)
    const sentBeforeData = await sentBeforeRes.json()
    assert.ok(
      !sentBeforeData.data.some(i => i.username === uniqueUsername),
      'stage=sent must NOT include Novo lead before outreach'
    )
    console.log('✅ 1. stage=to_contact vs stage=sent filtering (before send) passed')

    // 3. Mark lead as "Mensagem Enviada" via whatsapp and verify auto-timestamping
    const putSentRes = await fetch(`${baseUrl}/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Mensagem Enviada',
        outreach_channel: 'whatsapp',
        whatsapp: '11999887766',
        story_views_avg: 4500,
        story_clicks_avg: 320,
        story_asking_price: 500,
        campaign_game: 'Block Win',
      }),
    })
    assert.strictEqual(putSentRes.status, 200, 'PUT must accept Mensagem Enviada status')
    const { data: sentLead } = await putSentRes.json()
    assert.strictEqual(sentLead.status, 'Mensagem Enviada')
    assert.strictEqual(sentLead.outreach_channel, 'whatsapp')
    assert.ok(sentLead.contacted_at, 'contacted_at must be stamped automatically when leaving Novo')
    assert.ok(sentLead.last_contact_at, 'last_contact_at must be stamped automatically')
    assert.strictEqual(sentLead.whatsapp, '11999887766')
    assert.strictEqual(sentLead.story_views_avg, 4500)
    assert.strictEqual(sentLead.story_clicks_avg, 320)
    assert.strictEqual(sentLead.story_asking_price, 500)
    assert.strictEqual(sentLead.campaign_game, 'Block Win')

    const originalContactedAt = sentLead.contacted_at

    // Ensure future status transitions preserve contacted_at while updating last_contact_at
    await new Promise(r => setTimeout(r, 15))
    const putNegRes = await fetch(`${baseUrl}/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Em negociação',
        outreach_channel: 'whatsapp',
      }),
    })
    const { data: negLead } = await putNegRes.json()
    assert.strictEqual(negLead.contacted_at, originalContactedAt, 'Subsequent updates must preserve original contacted_at')
    console.log('✅ 2. Mensagem Enviada status + auto contacted_at preservation passed')

    // 4. Verify stage=sent and channel=whatsapp match the contacted lead
    const sentAfterRes = await fetch(`${baseUrl}?stage=sent&channel=whatsapp&search=${uniqueUsername}`)
    const sentAfterData = await sentAfterRes.json()
    assert.ok(
      sentAfterData.data.some(i => i.username === uniqueUsername),
      'stage=sent&channel=whatsapp must return contacted lead'
    )

    // 5. Re-mining / upsertInfluencer must preserve outreach_channel & contacted_at
    await store.upsertInfluencer({
      username: uniqueUsername,
      followers_count: 36000,
      bio: 'Nova bio vinda do Apify',
    })
    const refreshed = await store.getInfluencerFullProfile(uniqueUsername)
    assert.strictEqual(refreshed.influencer.status, 'Em negociação')
    assert.strictEqual(refreshed.influencer.outreach_channel, 'whatsapp')
    assert.strictEqual(refreshed.influencer.contacted_at, originalContactedAt)
    console.log('✅ 3. upsertInfluencer preserves outreach_channel and contacted_at')

    // 6. Verify /api/influencers/stats returns v3 funnel metrics cleanly (no NaN)
    const statsRes = await fetch(`${baseUrl}/stats`)
    assert.strictEqual(statsRes.status, 200)
    const stats = await statsRes.json()
    console.log('Stats v3 summary:', {
      total: stats.total,
      toContactCount: stats.toContactCount,
      sentWaitingCount: stats.sentWaitingCount,
      sentTotalCount: stats.sentTotalCount,
      repliedCount: stats.repliedCount,
      responseRate: stats.responseRate,
      channelCounts: stats.channelCounts,
    })
    assert.strictEqual(typeof stats.toContactCount, 'number')
    assert.strictEqual(typeof stats.sentWaitingCount, 'number')
    assert.strictEqual(typeof stats.sentTotalCount, 'number')
    assert.strictEqual(typeof stats.repliedCount, 'number')
    assert.strictEqual(typeof stats.responseRate, 'number')
    assert.ok(!Number.isNaN(stats.responseRate), 'responseRate must never be NaN')
    assert.strictEqual(typeof stats.missingDataCount, 'number')
    assert.ok(stats.channelCounts && typeof stats.channelCounts.whatsapp === 'number')
    assert.ok(stats.publicidadesSummary && typeof stats.publicidadesSummary.totalInvested === 'number')
    assert.strictEqual(
      stats.toContactCount + stats.sentTotalCount,
      stats.total,
      'toContactCount + sentTotalCount should equal total'
    )
    console.log('✅ 4. Funnel & dashboard stats v3 contract passed')

    // 7. Review Focus edge cases: empty strings & reverting to Novo
    const putEmptyRes = await fetch(`${baseUrl}/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Novo',
        story_views_avg: '',
        story_clicks_avg: '',
        story_asking_price: '',
        campaign_game: '',
      }),
    })
    assert.strictEqual(putEmptyRes.status, 200)
    const { data: revertedLead } = await putEmptyRes.json()
    assert.strictEqual(revertedLead.status, 'Novo')
    assert.strictEqual(revertedLead.story_views_avg, 0)
    assert.strictEqual(revertedLead.story_clicks_avg, 0)
    assert.strictEqual(revertedLead.story_asking_price, 0)
    assert.strictEqual(revertedLead.campaign_game, null)

    const backToQueueRes = await fetch(`${baseUrl}?stage=sent&search=${uniqueUsername}`)
    const backToQueueData = await backToQueueRes.json()
    assert.ok(
      !backToQueueData.data.some(i => i.username === uniqueUsername),
      'Reverting lead to Novo must remove it from stage=sent'
    )
    console.log('✅ 5. Review Focus edge cases (empty fields & Novo revert) passed')

    // 8. Instagram URL / @handle normalization & invalid non-profile path rejection
    assert.strictEqual(store.normalizeHandleInput('https://www.instagram.com/@EuGael/?igsh=abc'), 'eugael')
    assert.strictEqual(store.normalizeHandleInput('instagram.com/rayssamylene_/reels/'), 'rayssamylene_')
    assert.strictEqual(store.normalizeHandleInput('https://www.instagram.com/reel/ABC123/'), '')

    const urlLeadRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `https://www.instagram.com/@url_teste_${Date.now()}/?igsh=xyz`,
        full_name: 'Lead Colado Como Link',
      }),
    })
    assert.strictEqual(urlLeadRes.status, 201)
    const { data: urlLead } = await urlLeadRes.json()
    assert.ok(urlLead.username.startsWith('url_teste_') && !urlLead.username.includes('instagram.com'))

    const badUrlRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'https://www.instagram.com/reel/C99999/',
      }),
    })
    assert.strictEqual(badUrlRes.status, 400)
    console.log('✅ 6. Instagram URL/@handle normalization & invalid link rejection passed')

    // 9. Honest seed metrics (no fake 25k/35k or OURO/PRATA), Samurai dedup & ig_not_found + email field
    const samuraiOld = await store.getInfluencerFullProfile('samuraii_da_resenha')
    assert.strictEqual(samuraiOld, null, 'Typo samuraii_da_resenha must be merged into samuraii_da_resenhaa')

    const samuraiReal = await store.getInfluencerFullProfile('samuraii_da_resenhaa')
    assert.ok(samuraiReal && samuraiReal.influencer, 'samuraii_da_resenhaa must exist unified')
    assert.strictEqual(samuraiReal.influencer.followers_count, 0, 'Unscraped Excel lead must have 0 followers until enriched')
    assert.strictEqual(samuraiReal.influencer.classification, null, 'Unscraped Excel lead must have null classification until enriched')
    assert.strictEqual(samuraiReal.influencer.score, 0, 'Unscraped Excel lead must have 0 score until enriched')

    const deadLead = await store.getInfluencerFullProfile('eugael')
    assert.ok(deadLead && deadLead.influencer.ig_not_found, 'Verified not_found IG account (eugael) must be flagged ig_not_found=true')

    const emailLeadRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `email_teste_${Date.now()}`,
        full_name: 'Criador Com Email',
        email: 'Contato@CriadorTeste.COM',
        whatsapp: '85988887777',
      }),
    })
    assert.strictEqual(emailLeadRes.status, 201)
    const { data: emailLead } = await emailLeadRes.json()
    assert.strictEqual(emailLead.email, 'contato@criadorteste.com', 'Email must be normalized and saved')
    assert.strictEqual(emailLead.followers_count, 0, 'Manual lead without followers must stay 0 (honest)')
    assert.strictEqual(emailLead.classification, null, 'Manual lead without metrics must stay classification=null')
    console.log('✅ 7. Honest seed metrics, Samurai dedup, ig_not_found & email persistence passed')

    // 10. POST /api/influencers/:id/enrich (success + notFound with stubbed apifyService, 0 tokens burned)
    const apifyService = require('../server/services/apify')
    const originalEnrich = apifyService.enrichSingleProfile
    try {
      apifyService.enrichSingleProfile = async (uname) => ({
        ok: true,
        notFound: false,
        profile: {
          username: uname,
          full_name: 'Criador Atualizado IG',
          followers_count: 52000,
          avg_reels_views: 19000,
          engagement_rate: 36.5,
          bio: 'Contato: parceria@teste.com',
          email: 'parceria@teste.com',
          whatsapp: '5511900001111',
          is_agency: false,
          promotes_raffle: false,
          promotes_shopee: false,
          has_competitor: false,
          competitor_name: null,
        },
      })

      const enrichOkRes = await fetch(`${baseUrl}/${emailLead.id}/enrich`, { method: 'POST' })
      assert.strictEqual(enrichOkRes.status, 200)
      const enrichOk = await enrichOkRes.json()
      assert.strictEqual(enrichOk.notFound, false)
      assert.strictEqual(enrichOk.data.followers_count, 52000)
      assert.strictEqual(enrichOk.data.whatsapp, '85988887777', 'Must preserve existing manual WhatsApp')
      assert.strictEqual(enrichOk.data.email, 'contato@criadorteste.com', 'Must preserve existing manual email')
      assert.ok(enrichOk.data.score > 0 && enrichOk.data.classification, 'Must calculate score after real IG enrichment')

      apifyService.enrichSingleProfile = async (uname) => ({
        ok: false,
        notFound: true,
        errorReason: 'not_found',
        username: uname,
      })

      const enrichMissingRes = await fetch(`${baseUrl}/${urlLead.id}/enrich`, { method: 'POST' })
      assert.strictEqual(enrichMissingRes.status, 200)
      const enrichMissing = await enrichMissingRes.json()
      assert.strictEqual(enrichMissing.notFound, true)
      assert.strictEqual(enrichMissing.data.ig_not_found, true)
      console.log('✅ 8. POST /api/influencers/:id/enrich (real metrics & ig_not_found flag) passed')
    } finally {
      apifyService.enrichSingleProfile = originalEnrich
    }

    console.log('\n🎉 ALL V3.0 SDR WORKFLOW TESTS PASSED!')
  } finally {
    server.close()
  }
}

runV3WorkflowTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
