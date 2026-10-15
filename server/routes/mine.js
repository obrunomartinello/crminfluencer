const express = require('express')
const router = express.Router()
const store = require('../db/store')
const { runMiningActor } = require('../services/apify')
const { inspectLink } = require('../services/linktree')
const { calculateScore } = require('../services/scoring')

// POST /api/mine
router.post('/', async (req, res) => {
  try {
    const { query, count } = req.body

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query é obrigatório' })
    }

    const countNum = Math.min(Math.max(parseInt(count) || 25, 1), 100)

    console.log(`[mine] Iniciando varredura: query="${query}", count=${countNum}`)

    // 1. Minerar perfis via Apify (ou mock)
    const profiles = await runMiningActor(query.trim(), countNum)

    console.log(`[mine] ${profiles.length} perfis minerados — iniciando enriquecimento...`)

    let imported = 0
    let skipped = 0

    // 2. Enriquecer cada perfil
    for (const profile of profiles) {
      try {
        // Inspecionar link da bio
        const linkData = profile.external_url
          ? await inspectLink(profile.external_url)
          : { whatsapp: null, hasCompetitor: false, competitorName: null }

        const enriched = {
          ...profile,
          whatsapp: profile.whatsapp || linkData.whatsapp,
          has_competitor: profile.has_competitor || linkData.hasCompetitor,
          competitor_name: profile.competitor_name || linkData.competitorName,
        }

        // Calcular score
        const { score, classification } = calculateScore(enriched)

        // Upsert no store (Supabase ou in-memory)
        await store.upsertInfluencer({ ...enriched, score, classification })
        imported++
      } catch (profileErr) {
        console.error(`[mine] Erro no perfil @${profile.username}:`, profileErr.message)
        skipped++
      }
    }

    console.log(`[mine] Concluído: ${imported} importados, ${skipped} pulados`)
    res.json({ imported, skipped })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
