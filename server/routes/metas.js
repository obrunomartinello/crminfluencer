/**
 * @pilar PILAR 4 — Financeiro: Publicidades & Metas (Rotas /api/metas)
 */
const express = require('express')
const router = express.Router()
const store = require('../db/store')

// GET /api/metas/stats — Resumo das metas de depositantes
router.get('/stats', async (req, res) => {
  try {
    const stats = await store.getMetasStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/metas — Lista de metas
router.get('/', async (req, res) => {
  try {
    const metas = await store.listMetas()
    res.json({ data: metas, total: metas.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/metas — Criar meta de depositantes
router.post('/', async (req, res) => {
  try {
    const { influencer_username, target_depositors } = req.body
    if (!influencer_username || !target_depositors) {
      return res.status(400).json({ error: 'influencer_username e target_depositors são obrigatórios' })
    }

    const created = await store.createMeta(req.body)
    res.status(201).json({ data: created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/metas/:id — Atualizar meta
router.put('/:id', async (req, res) => {
  try {
    const updated = await store.updateMeta(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Meta não encontrada' })
    }
    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/metas/:id/increment — Ação rápida "+ Depositantes" do Pedro
router.post('/:id/increment', async (req, res) => {
  try {
    const amount = parseInt(req.body.amount) || 1
    const updated = await store.incrementMeta(req.params.id, amount)
    if (!updated) {
      return res.status(404).json({ error: 'Meta não encontrada' })
    }
    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
