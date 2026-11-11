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

    console.log('\n🎉 ALL V3.0 SDR WORKFLOW TESTS PASSED!')
  } finally {
    server.close()
  }
}

runV3WorkflowTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
