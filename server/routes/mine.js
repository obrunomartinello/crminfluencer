const express = require('express')
const router = express.Router()
const store = require('../db/store')
const { runMiningActor } = require('../services/apify')
const { fastInspectBio } = require('../services/linktree')
const { calculateScore } = require('../services/scoring')

// POST /api/mine
router.post('/', async (req, res) => {
  try {
    const { query, count } = req.body

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query é obrigatório' })
    }

    const countNum = Math.min(Math.max(parseInt(count) || 25, 1), 100)

    console.log(`[mine] Iniciando varredura rápida: query="${query}", count=${countNum}`)

    // 1. Minerar perfis via Apify
    const profiles = await runMiningActor(query.trim(), countNum)

    console.log(`[mine] ${profiles.length} perfis recebidos — processando e salvando...`)

    let imported = 0
    let skipped = 0

    // 2. Enriquecimento ultra-rápido (em memória, sem travar rede) e salvar todos
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
        console.error(`[mine] Erro no perfil @${profile.username}:`, profileErr.message)
        skipped++
      }
    }

    console.log(`[mine] Concluído: ${imported} importados com sucesso`)
    res.json({ imported, skipped })
  } catch (err) {
    console.error('❌ [mine] Erro geral na rota:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
