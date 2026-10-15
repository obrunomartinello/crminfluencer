const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/influencers', require('../server/routes/influencers'))
app.use('/api/mine', require('../server/routes/mine'))
app.use('/api/inspect-link', require('../server/routes/inspect'))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

module.exports = app
