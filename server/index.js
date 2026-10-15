require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// Rotas
app.use('/api/influencers', require('./routes/influencers'))
app.use('/api/mine', require('./routes/mine'))
app.use('/api/inspect-link', require('./routes/inspect'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Scout CRM Server rodando na porta ${PORT}`)
})
