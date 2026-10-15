const express = require('express')
const router = express.Router()
const store = require('../db/store')

const VALID_STATUSES = ['Novo', 'Qualificado', 'Abordado', 'Negociando', 'Fechado', 'Desqualificado']
const VALID_CLASSIFICATIONS = ['OURO', 'PRATA', 'BRONZE', 'LIXO']

// GET /api/influencers/stats — DEVE vir antes de /:id
router.get('/stats', async (req, res) => {
  try {
    const stats = await store.getStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/influencers — com filtros e paginação
router.get('/', async (req, res) => {
  try {
    const { search, status, classification, page = 1, limit = 20 } = req.query
    const result = await store.listInfluencers({ search, status, classification, page, limit })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/influencers — cadastro manual
router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.username) {
      return res.status(400).json({ error: 'username é obrigatório' })
    }

    const created = await store.createInfluencer(body)
    res.status(201).json({ data: created })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/influencers/:id — atualização parcial
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const body = req.body

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` })
    }
    if (body.classification && !VALID_CLASSIFICATIONS.includes(body.classification)) {
      return res.status(400).json({ error: `Classificação inválida. Use: ${VALID_CLASSIFICATIONS.join(', ')}` })
    }

    const updated = await store.updateInfluencer(id, body)
    if (!updated) {
      return res.status(404).json({ error: 'Influenciador não encontrado' })
    }
    res.json({ data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/influencers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const success = await store.deleteInfluencer(id)
    res.json({ success })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
