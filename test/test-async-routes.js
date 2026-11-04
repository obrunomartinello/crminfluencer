require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const express = require('express')
const assert = require('assert')

async function runRoutesTest() {
  console.log('--- TEST: Express Mining Routes (/api/mine/start & /api/mine/status) ---')
  const app = express()
  app.use(express.json())
  app.use('/api/mine', require('../server/routes/mine'))

  const server = app.listen(3099)
  const baseUrl = 'http://127.0.0.1:3099/api/mine'

  try {
    // 1. Iniciar busca assíncrona
    console.log('1. Testing POST /api/mine/start...')
    const startRes = await fetch(`${baseUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'humor sertao', count: 5 })
    })

    assert.strictEqual(startRes.status, 200, 'POST /start should return 200')
    const startData = await startRes.json()
    console.log('POST /start response:', startData)
    assert.ok(startData.jobId, 'jobId should be present')
    assert.ok(startData.status === 'RUNNING' || startData.status === 'COMPLETED')

    // 2. Checar status
    console.log('2. Testing GET /api/mine/status/:jobId...')
    const statusRes = await fetch(`${baseUrl}/status/${startData.jobId}`)
    assert.strictEqual(statusRes.status, 200, 'GET /status/:id should return 200')
    const statusData = await statusRes.json()
    console.log('GET /status response:', statusData)
    assert.strictEqual(statusData.id, startData.jobId)
    assert.ok(['RUNNING', 'COMPLETED'].includes(statusData.status))

    console.log('\n🎉 ALL EXPRESS ROUTE TESTS PASSED!')
  } finally {
    server.close()
  }
}

runRoutesTest().catch(err => {
  console.error('❌ Route test failed:', err)
  process.exit(1)
})
