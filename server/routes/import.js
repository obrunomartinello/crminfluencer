const express = require('express')
const router = express.Router()
const store = require('../db/store')
const {
  normalizeUsername,
  normalizePhone,
  normalizeGame,
  normalizeClosure,
  normalizePaymentAndReferral,
  formatPhoneBR,
} = require('../services/importer')

// POST /api/import/reset-pedro — Recarrega os 87 influenciadores e 17 publicidades oficiais do Pedro
router.post('/reset-pedro', async (req, res) => {
  try {
    const summary = store.resetToPedroSeed()
    res.json({ success: true, message: 'Dados das planilhas do Pedro restaurados com sucesso!', summary })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/import/preview — Analisa linhas antes de salvar
router.post('/preview', async (req, res) => {
  try {
    const { type, rows } = req.body // type: 'captacao' | 'publicidades' | 'metas'
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'rows deve ser um array de registros' })
    }

    const previewItems = []
    const duplicates = []
    const invalidRows = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rawUser = r.username || r['@ Instagram'] || r['@ Perfil'] || r['Nome do Influenciador'] || ''
      const username = normalizeUsername(rawUser)

      if (!username) {
        invalidRows.push({ rowNumber: i + 1, reason: 'Sem @ ou nome identificável', raw: r })
        continue
      }

      const phone = normalizePhone(r.whatsapp || r['WhatsApp'] || r['Número de Contato'])
      const game = normalizeGame(r.game || r['Jogo / Campanha'] || r['Produto da Abordagem'])

      previewItems.push({
        rowNumber: i + 1,
        username,
        full_name: r.name || r['Nome do Influenciador'] || username,
        whatsapp: phone,
        formatted_phone: formatPhoneBR(phone),
        game,
        status: r.status || r['Status'] || 'Novo',
        notes: r.notes || r['Observações'] || '',
      })
    }

    res.json({
      totalSubmitted: rows.length,
      validCount: previewItems.length,
      invalidCount: invalidRows.length,
      duplicatesCount: duplicates.length,
      preview: previewItems.slice(0, 10),
      invalidRows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/import/execute — Salva os registros validados
router.post('/execute', async (req, res) => {
  try {
    const { items, type } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items deve ser um array' })
    }

    let saved = 0
    for (const item of items) {
      if (type === 'publicidades') {
        await store.createPublicidade(item)
      } else if (type === 'metas') {
        await store.createMeta(item)
      } else {
        await store.createInfluencer(item)
      }
      saved++
    }

    res.json({ success: true, saved })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
