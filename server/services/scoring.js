/**
 * calculateScore — pure function, no side effects
 * @param {Object} inf - influencer object
 * @returns {{ score: number, classification: string }}
 */
function calculateScore(inf) {
  const followers = inf.followers_count || 0
  const engagementRate = followers > 0 ? (inf.engagement_rate || 0) : 0

  // Bot penalty: high followers but very low engagement → LIXO
  if (followers > 10_000 && engagementRate < 2) {
    return { score: 10, classification: 'LIXO' }
  }

  let score = 0

  // +30: Sweet spot de seguidores (10k–120k)
  if (followers >= 10_000 && followers <= 120_000) {
    score += 30
  }

  // +35: Engajamento alto em Reels (≥15%)
  if (engagementRate >= 15) {
    score += 35
  }

  // +20: WhatsApp comercial encontrado
  if (inf.whatsapp) {
    score += 20
  }

  // +15: Audiência virgem (sem concorrente na bio)
  if (!inf.has_competitor) {
    score += 15
  }

  // Classificação final
  let classification
  if (score >= 75) classification = 'OURO'
  else if (score >= 50) classification = 'PRATA'
  else if (score >= 30) classification = 'BRONZE'
  else classification = 'LIXO'

  return { score, classification }
}

module.exports = { calculateScore }

// --- Verificação inline (rode: node server/services/scoring.js) ---
if (require.main === module) {
  const cases = [
    {
      label: 'OURO perfeito',
      inf: { followers_count: 50000, engagement_rate: 20, whatsapp: '5511999998888', has_competitor: false },
      expectedScore: 100,
      expectedClass: 'OURO',
    },
    {
      label: 'Bot penalty (seguidores comprados)',
      inf: { followers_count: 50000, engagement_rate: 0.5, whatsapp: null, has_competitor: true },
      expectedScore: 10,
      expectedClass: 'LIXO',
    },
    {
      label: 'Pequeno sem WhatsApp',
      inf: { followers_count: 5000, engagement_rate: 10, whatsapp: null, has_competitor: true },
      expectedScore: 0,
      expectedClass: 'LIXO',
    },
    {
      label: 'Zero followers (sem crash)',
      inf: { followers_count: 0, engagement_rate: 0, whatsapp: null, has_competitor: false },
      expectedScore: 15,
      expectedClass: 'LIXO', // score=15 < 30, correto per spec
    },
    {
      label: 'PRATA com concorrente mas WhatsApp',
      inf: { followers_count: 60000, engagement_rate: 3, whatsapp: '5511988887777', has_competitor: true },
      expectedScore: 50,
      expectedClass: 'PRATA',
    },
  ]

  let passed = 0
  for (const { label, inf, expectedScore, expectedClass } of cases) {
    const result = calculateScore(inf)
    const ok = result.score === expectedScore && result.classification === expectedClass
    console.log(`[${ok ? '✅' : '❌'}] ${label}: score=${result.score} (expected ${expectedScore}), class=${result.classification} (expected ${expectedClass})`)
    if (ok) passed++
  }
  console.log(`\n${passed}/${cases.length} casos passaram`)
}
