const express = require('express')
const router = express.Router()
const store = require('../db/store')

// GET /api/publicidades/stats — Resumo financeiro das publicidades
router.get('/stats', async (req, res) => {
  try {
    const stats = await store.getPublicidadesStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/publicidades — Lista com filtros e paginação
router.get('/', async (req, res) => {
  try {
    const { influencer, game, closureType, deliveryStatus, paymentStatus, page, limit } = req.query
    const result = await store.listPublicidades({
      influencer,
      game,
      closureType,
      deliveryStatus,
      paymentStatus,
      page,
      limit,
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/publicidades — Criar nova publicidade
router.post('/', async (req, res) => {
  try {
    const { influencer_username, invested_amount } = req.body
    if (!influencer_username) {
      return res.status(400).json({ error: 'influencer_username é obrigatório' })
    }
    if (invested_amount === undefined || invested_amount === null) {
      return res.status(400).json({ error: 'invested_amount é obrigatório' })
    }

    const created = await store.createPublicidade(req.body)
    res.status(201).json({ data: created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/publicidades/:id — Atualizar publicidade existente
router.put('/:id', async (req, res) => {
  try {
    const updated = await store.updatePublicidade(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Publicidade não encontrada' })
    }
    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/publicidades/:id — Remover publicidade
router.delete('/:id', async (req, res) => {
  try {
    const ok = await store.deletePublicidade(req.params.id)
    if (!ok) {
      return res.status(404).json({ error: 'Publicidade não encontrada' })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
