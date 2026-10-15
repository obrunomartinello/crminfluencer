const express = require('express')
const router = express.Router()
const { inspectLink } = require('../services/linktree')

// POST /api/inspect-link
router.post('/', async (req, res) => {
  try {
    const { url } = req.body
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url é obrigatório' })
    }

    const result = await inspectLink(url)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
