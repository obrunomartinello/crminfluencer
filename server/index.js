require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// Rotas
app.use('/api/influencers', require('./routes/influencers'))
app.use('/api/publicidades', require('./routes/publicidades'))
app.use('/api/metas', require('./routes/metas'))
app.use('/api/import', require('./routes/import'))
app.use('/api/mine', require('./routes/mine'))
app.use('/api/inspect-link', require('./routes/inspect'))

// Lista fixa dos 4 jogos da operação do Pedro
app.get('/api/games', (req, res) => {
  const store = require('./db/store')
  res.json({ games: store.listGames() })
})

// Health check + Keepalive do Supabase (sempre sem cache CDN)
async function handleKeepalive(req, res) {
  const store = require('./db/store')
  const supabase = await store.checkSupabaseHealth()
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.json({
    ok: true,
    keepalive: true,
    timestamp: new Date().toISOString(),
    supabase,
  })
}

app.get('/api/health', handleKeepalive)
app.get('/api/cron/keepalive', handleKeepalive)

const PORT = process.env.PORT || 3001
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎰 Jackpot CRM Server rodando na porta ${PORT}`)
  })
}

module.exports = app
