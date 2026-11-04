const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const store = require('../db/store')
const { startAsyncSearch, checkActorRun, runMiningActor } = require('../services/apify')
const { fastInspectBio } = require('../services/linktree')
const { calculateScore } = require('../services/scoring')

// Armazenamento em memória de tarefas de varredura
const jobs = new Map()

/**
 * Processa perfis brutos da Apify, aplica o motor de enriquecimento e salva no banco/store
 */
async function processAndIngestProfiles(profiles) {
  let imported = 0
  let skipped = 0

  for (const profile of profiles) {
    try {
      const linkData = fastInspectBio(profile.bio, profile.external_url)

      const enriched = {
        ...profile,
        whatsapp: profile.whatsapp || linkData.whatsapp,
        has_competitor: profile.has_competitor || linkData.hasCompetitor,
        competitor_name: profile.competitor_name || linkData.competitorName,
        is_agency: profile.is_agency || linkData.isAgency,
        promotes_raffle: profile.promotes_raffle || linkData.promotesRaffle,
        promotes_shopee: profile.promotes_shopee || linkData.promotesShopee,
      }

      // Calcular pontuação e tags do SDR
      const { score, classification, positives, tags, metrics } = calculateScore(enriched, linkData)

      // Salvar lead na base
      await store.upsertInfluencer({
        ...enriched,
        score,
        classification,
        story_views_avg: metrics?.estimatedStoryViews || 0,
        story_clicks_avg: metrics?.estimatedStoryClicks || 0,
        estimated_revenue: metrics?.projectedRevenueBRL || 0,
        user_notes: positives?.length > 0 ? `Tags: ${tags.join(', ')}` : '',
      })
      imported++
    } catch (profileErr) {
      console.error(`[mine] Erro no perfil @${profile?.username}:`, profileErr.message)
      skipped++
    }
  }

  return { imported, skipped }
}

// POST /api/mine/start — Inicia varredura assíncrona (<500ms) sem travar Vercel
router.post('/start', async (req, res) => {
  try {
    const { query, count } = req.body

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Palavra-chave (query) é obrigatória' })
    }

    const countNum = Math.min(Math.max(parseInt(count) || 25, 5), 50)
    const cleanQuery = query.trim()
    const jobId = crypto.randomUUID()

    console.log(`[mine/start] Disparando busca assíncrona: "${cleanQuery}" (limite: ${countNum}) — JobId: ${jobId}`)

    const actorResult = await startAsyncSearch(cleanQuery, countNum)

    const job = {
      id: jobId,
      runId: actorResult.runId,
      defaultDatasetId: actorResult.defaultDatasetId,
      query: cleanQuery,
      count: countNum,
      status: actorResult.isMock ? 'COMPLETED' : 'RUNNING',
      createdAt: Date.now(),
      imported: 0,
      error: null,
    }

    if (actorResult.isMock && actorResult.items) {
      const { imported } = await processAndIngestProfiles(actorResult.items)
      job.imported = imported
    }

    jobs.set(jobId, job)

    res.json({
      jobId,
      status: job.status,
      query: cleanQuery,
      count: countNum,
    })
  } catch (err) {
    console.error('❌ [mine/start] Erro ao iniciar varredura:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/mine/status/:jobId — Checa progresso da varredura sem timeout
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const job = jobs.get(jobId)

    if (!job) {
      return res.status(404).json({ error: `Job com ID ${jobId} não encontrado` })
    }

    // Se já estiver concluído ou falhou, retorna direto
    if (job.status === 'COMPLETED') {
      return res.json({ id: jobId, status: 'COMPLETED', query: job.query, imported: job.imported })
    }
    if (job.status === 'FAILED') {
      return res.json({ id: jobId, status: 'FAILED', query: job.query, error: job.error })
    }

    // Se estiver em execução, consulta o status no Apify
    const check = await checkActorRun(job.runId, job.defaultDatasetId)

    if (check.status === 'SUCCEEDED') {
      console.log(`[mine/status] Apify concluiu para Job ${jobId}. Ingerindo ${check.items.length} criadores...`)
      const { imported } = await processAndIngestProfiles(check.items)
      job.status = 'COMPLETED'
      job.imported = imported
      return res.json({ id: jobId, status: 'COMPLETED', query: job.query, imported })
    }

    if (check.status === 'FAILED') {
      console.warn(`[mine/status] Apify falhou para Job ${jobId}: ${check.error}`)
      job.status = 'FAILED'
      job.error = check.error
      return res.json({ id: jobId, status: 'FAILED', query: job.query, error: check.error })
    }

    // Continua executando
    res.json({ id: jobId, status: 'RUNNING', query: job.query })
  } catch (err) {
    console.error(`❌ [mine/status] Erro ao checar status do Job ${req.params.jobId}:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/mine — Fallback legado síncrono mantido
router.post('/', async (req, res) => {
  try {
    const { query, count } = req.body
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query é obrigatório' })
    }

    const countNum = Math.min(Math.max(parseInt(count) || 25, 1), 50)
    console.log(`[mine] Executando rota síncrona: query="${query}", count=${countNum}`)

    const profiles = await runMiningActor(query.trim(), countNum)
    const { imported, skipped } = await processAndIngestProfiles(profiles)

    res.json({ imported, skipped })
  } catch (err) {
    console.error('❌ [mine] Erro na rota legado:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
