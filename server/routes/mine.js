const express = require('express')
const router = express.Router()
const store = require('../db/store')
const {
  startAsyncSearch,
  startProfileEnrichment,
  checkRunsStatus,
  checkActorRun,
  extractCreatorsFromSearchItems,
  runMiningActor,
  getQuotaStatus,
  clearQuotaCache,
} = require('../services/apify')
const { fastInspectBio } = require('../services/linktree')
const { calculateScore } = require('../services/scoring')

// Cache local em memória (acelera consultas e preserva metadados de Reel da Fase 1)
const jobs = new Map()

function encodeJobToken(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodeJobToken(token) {
  try {
    if (!token || typeof token !== 'string') return null
    if (token.startsWith('mock-')) return null
    const json = Buffer.from(token, 'base64url').toString('utf8')
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.r)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Processa perfis da Apify, aplica enriquecimento e salva no banco/store
 */
async function processAndIngestProfiles(profiles, options = {}) {
  let imported = 0
  let newCount = 0
  let updatedCount = 0
  let skipped = 0
  const ingestedRecords = []
  const now = new Date().toISOString()

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
        source_query: options.query || profile.source_query || null,
        last_mined_at: now,
      }

      const { score, classification, positives, tags, metrics } = calculateScore(enriched, linkData)

      const res = await store.upsertInfluencer({
        ...enriched,
        score,
        classification,
        story_views_avg: metrics?.estimatedStoryViews || 0,
        story_clicks_avg: metrics?.estimatedStoryClicks || 0,
        estimated_revenue: metrics?.projectedRevenueBRL || 0,
        user_notes: positives?.length > 0 ? `Tags: ${tags.join(', ')}` : '',
      })

      if (res && res.record) {
        ingestedRecords.push(res.record)
        if (res.action === 'inserted') newCount++
        else updatedCount++
      }
      imported++
    } catch (profileErr) {
      console.error(`[mine] Erro no perfil @${profile?.username}:`, profileErr.message)
      skipped++
    }
  }

  return { imported, newCount, updatedCount, skipped, records: ingestedRecords }
}

// POST /api/mine/start — Inicia varredura assíncrona em 2 fases (<800ms)
router.post('/start', async (req, res) => {
  try {
    const { query, count, mode = 'hybrid', skipExisting = true } = req.body

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Palavra-chave (query) é obrigatória' })
    }

    const countNum = Math.min(Math.max(parseInt(count) || 20, 5), 50)
    const cleanQuery = query.trim()
    const validMode = ['popular', 'user', 'hybrid'].includes(mode) ? mode : 'hybrid'

    const actorResult = await startAsyncSearch(cleanQuery, countNum, { mode: validMode })

    if (actorResult.isMock && actorResult.items) {
      const jobId = `mock-${Date.now()}`
      const { imported, newCount, updatedCount, records } = await processAndIngestProfiles(actorResult.items, { query: cleanQuery })
      const mockJob = {
        id: jobId,
        status: 'COMPLETED',
        query: cleanQuery,
        imported,
        newCount,
        updatedCount,
        items: records,
      }
      jobs.set(jobId, mockJob)
      return res.json({
        jobId,
        status: 'COMPLETED',
        query: cleanQuery,
        count: countNum,
        mode: validMode,
        imported,
        newCount,
        updatedCount,
        items: records,
        isMock: true,
      })
    }

    const tokenPayload = {
      s: 1, // Stage 1: Descoberta (Reels virais + Live Search)
      q: cleanQuery,
      c: countNum,
      m: validMode,
      se: skipExisting ? 1 : 0,
      r: actorResult.runs,
    }
    const jobId = encodeJobToken(tokenPayload)

    console.log(`[mine/start] Fase 1 (${validMode}) iniciada para "${cleanQuery}" (limite: ${countNum})`)

    jobs.set(jobId, {
      id: jobId,
      stage: 1,
      query: cleanQuery,
      count: countNum,
      mode: validMode,
      skipExisting: !!skipExisting,
      runs: actorResult.runs,
      status: 'RUNNING',
      createdAt: Date.now(),
    })

    res.json({
      jobId,
      status: 'RUNNING',
      stage: 1,
      stageLabel: 'Buscando criadores ativos no Instagram...',
      query: cleanQuery,
      count: countNum,
      mode: validMode,
    })
  } catch (err) {
    console.error('❌ [mine/start] Erro ao iniciar varredura:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/mine/status/:jobId — Checa Fase 1, dispara Fase 2 (Enriquecimento) e conclui stateless
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    let cachedJob = jobs.get(jobId)

    if (cachedJob?.status === 'COMPLETED') {
      return res.json({
        id: jobId,
        status: 'COMPLETED',
        query: cachedJob.query,
        imported: cachedJob.imported,
        newCount: cachedJob.newCount || 0,
        updatedCount: cachedJob.updatedCount || 0,
        items: cachedJob.items || [],
      })
    }

    if (cachedJob?.status === 'FAILED') {
      return res.json({ id: jobId, status: 'FAILED', query: cachedJob.query, error: cachedJob.error })
    }

    // Decodifica token stateless caso requisição chegue em outra instância serverless da Vercel
    const decoded = decodeJobToken(jobId)
    if (!cachedJob && !decoded) {
      return res.status(404).json({ error: `Job com ID ${jobId} não encontrado` })
    }

    const stage = cachedJob?.stage || decoded?.s || 1
    const query = cachedJob?.query || decoded?.q || ''
    const count = cachedJob?.count || decoded?.c || 20
    const mode = cachedJob?.mode || decoded?.m || 'hybrid'
    const skipExisting = cachedJob?.skipExisting ?? (decoded?.se !== 0)
    const runs = cachedJob?.runs || decoded?.r || []

    // --- FASE 1: DESCOBERTA -> TRANSIÇÃO PARA FASE 2 ---
    if (stage === 1) {
      const check = await checkRunsStatus(runs)

      if (check.status === 'RUNNING') {
        return res.json({
          id: jobId,
          status: 'RUNNING',
          stage: 1,
          stageLabel: `Descobrindo criadores para "${query}" no Instagram...`,
          query,
        })
      }

      if (check.status === 'FAILED') {
        if (cachedJob) {
          cachedJob.status = 'FAILED'
          cachedJob.error = check.error
        }
        return res.json({ id: jobId, status: 'FAILED', query, error: check.error })
      }

      // Fase 1 SUCCEEDED: extrair @usernames e priorizar quem ainda NÃO está no CRM
      const excludeSet = skipExisting ? store.getAllUsernames() : new Set()
      const { allUsernames, freshUsernames, metaByUsername } = extractCreatorsFromSearchItems(
        check.items,
        mode,
        excludeSet
      )

      const maxEnrich = Math.min(count, 25)
      const targetUsernames = freshUsernames.length > 0
        ? freshUsernames.slice(0, maxEnrich)
        : allUsernames.slice(0, Math.min(maxEnrich, 10))

      if (targetUsernames.length === 0) {
        const emptyRes = {
          id: jobId,
          status: 'COMPLETED',
          query,
          imported: 0,
          newCount: 0,
          updatedCount: 0,
          items: [],
          message: 'Nenhum perfil público encontrado para essa palavra-chave. Tente outro termo.',
        }
        if (cachedJob) Object.assign(cachedJob, emptyRes)
        return res.json(emptyRes)
      }

      // Inicia Fase 2: instagram-profile-scraper para extrair seguidores reais, bio e WhatsApp
      const enrichRun = await startProfileEnrichment(targetUsernames)
      const stage2Token = encodeJobToken({
        s: 2,
        q: query,
        c: count,
        m: mode,
        r: [{ id: enrichRun.id, ds: enrichRun.ds }],
      })

      jobs.set(stage2Token, {
        id: stage2Token,
        stage: 2,
        query,
        count,
        mode,
        runs: [{ id: enrichRun.id, ds: enrichRun.ds }],
        metaByUsername,
        freshTargetCount: freshUsernames.length,
        status: 'RUNNING',
        createdAt: Date.now(),
      })

      // Também marca no job antigo caso algum poll paralelo ainda use o token 1
      if (cachedJob) {
        cachedJob.nextJobId = stage2Token
      }

      return res.json({
        id: jobId,
        nextJobId: stage2Token,
        status: 'RUNNING',
        stage: 2,
        stageLabel: freshUsernames.length > 0
          ? `Extraindo seguidores, bio e WhatsApp de ${targetUsernames.length} criadores novos...`
          : `Atualizando métricas de ${targetUsernames.length} criadores encontrados...`,
        discoveredCount: targetUsernames.length,
        freshCount: freshUsernames.length,
        query,
      })
    }

    // --- FASE 2: ENRIQUECIMENTO DE PERFIS COMPLETOS ---
    const targetRun = runs[0]
    const metaByUsername = cachedJob?.metaByUsername || {}
    const check2 = await checkActorRun(targetRun.id, targetRun.ds, metaByUsername)

    if (check2.status === 'RUNNING') {
      return res.json({
        id: jobId,
        status: 'RUNNING',
        stage: 2,
        stageLabel: `Analisando engajamento, links e qualificando perfis de "${query}"...`,
        query,
      })
    }

    if (check2.status === 'FAILED') {
      if (cachedJob) {
        cachedJob.status = 'FAILED'
        cachedJob.error = check2.error
      }
      return res.json({ id: jobId, status: 'FAILED', query, error: check2.error })
    }

    // Concluído! Ingerir no banco/store e devolver os criadores prontos para o frontend
    console.log(`[mine/status] Fase 2 concluída para "${query}". Ingerindo ${check2.items.length} perfis completos...`)
    const { imported, newCount, updatedCount, records } = await processAndIngestProfiles(check2.items, { query })
    clearQuotaCache()

    const completedPayload = {
      id: jobId,
      status: 'COMPLETED',
      query,
      imported,
      newCount,
      updatedCount,
      items: records,
    }

    jobs.set(jobId, {
      ...(cachedJob || {}),
      ...completedPayload,
    })

    return res.json(completedPayload)
  } catch (err) {
    console.error(`❌ [mine/status] Erro ao checar status do Job:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/mine/quota — Termômetro de créditos gratuitos restantes na Apify
router.get('/quota', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const quota = await getQuotaStatus({ forceRefresh })
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.json(quota)
  } catch (err) {
    console.error('❌ [mine/quota] Erro ao consultar cota Apify:', err.message)
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
    const { imported, skipped } = await processAndIngestProfiles(profiles, { query: query.trim() })

    res.json({ imported, skipped })
  } catch (err) {
    console.error('❌ [mine] Erro na rota legado:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.encodeJobToken = encodeJobToken
router.decodeJobToken = decodeJobToken

module.exports = router
