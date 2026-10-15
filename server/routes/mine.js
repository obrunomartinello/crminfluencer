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

    console.log(`[mine] Iniciando varredura com Playbook do Pedro: query="${query}", count=${countNum}`)

    // 1. Minerar perfis completos via Apify
    const profiles = await runMiningActor(query.trim(), countNum)

    console.log(`[mine] ${profiles.length} perfis recebidos — iniciando enriquecimento e auditoria...`)

    let imported = 0
    let skipped = 0

    // 2. Enriquecer e auditar cada perfil
    for (const profile of profiles) {
      try {
        // Inspecionar link externo E bio (detecta WhatsApp, Concorrentes, Agência, Rifa, Shopee)
        const linkData = await inspectLink(profile.external_url, profile.bio)

        const enriched = {
          ...profile,
          whatsapp: profile.whatsapp || linkData.whatsapp,
          has_competitor: profile.has_competitor || linkData.hasCompetitor,
          competitor_name: profile.competitor_name || linkData.competitorName,
          is_agency: profile.is_agency || linkData.isAgency,
          promotes_raffle: profile.promotes_raffle || linkData.promotesRaffle,
          promotes_shopee: profile.promotes_shopee || linkData.promotesShopee,
        }

        // Calcular pontuação refinada com filtros anti-lixo
        const { score, classification } = calculateScore(enriched)

        // Upsert no store (Supabase PostgreSQL ou in-memory)
        await store.upsertInfluencer({ ...enriched, score, classification })
        imported++
      } catch (profileErr) {
        console.error(`[mine] Erro no perfil @${profile.username}:`, profileErr.message)
        skipped++
      }
    }

    console.log(`[mine] Concluído com sucesso: ${imported} importados, ${skipped} pulados`)
    res.json({ imported, skipped })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
