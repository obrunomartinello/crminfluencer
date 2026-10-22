// Termos de apelo infantil / menor de idade proibidos pela Portaria SPA/MF (.bet.br)
const UNDERAGE_TERMS = [
  'roblox', 'free fire', 'freefire', 'minecraft', '14y', '15y', '16y', '17y',
  'escola', 'colegio', 'colégio', 'terceirao', 'terceirão', 'ensino médio',
  'ensino medio', 'menor de idade', 'infantil', 'kids', 'teen', 'enem',
]

/**
 * Calcula a Mediana Recortada (Trimmed Median) de uma lista de números
 * Remove os maiores picos virais de Reels (que distorcem a média) e os menores
 * @param {number[]} values 
 * @returns {number}
 */
function calculateTrimmedMedian(values) {
  if (!values || values.length === 0) return 0
  if (values.length <= 3) {
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  // Ordenar valores de forma crescente
  const sorted = [...values].sort((a, b) => a - b)
  
  // Descartar o maior pico (outlier viral) e o menor (vídeo flopado)
  const trimmed = sorted.slice(1, sorted.length - 1)
  
  const mid = Math.floor(trimmed.length / 2)
  if (trimmed.length % 2 !== 0) {
    return trimmed[mid]
  }
  return Math.round((trimmed[mid - 1] + trimmed[mid]) / 2)
}

/**
 * calculateScore — motor refinado com o Playbook do Pedro + Portaria SPA/MF
 * @param {Object} inf - influencer object
 * @returns {{ score: number, classification: string, tags: string[] }}
 */
function calculateScore(inf) {
  const followers = inf.followers_count || 0
  const engagementRate = followers > 0 ? (inf.engagement_rate || 0) : 0
  const tags = []

  // 1. FILTRO REGULATÓRIO .BET.BR (Portaria SPA/MF): Risco de Menor de Idade
  const bioLower = (inf.bio || '').toLowerCase()
  const isUnderageRisk = UNDERAGE_TERMS.some(term => bioLower.includes(term))
  if (isUnderageRisk) {
    tags.push('🚫 Risco SPA/MF (Apelo Infantil/Menor)')
    return { score: 0, classification: 'LIXO', tags }
  }

  // 2. Penalidade Anti-Bot: seguidores comprados / fantasma (<2% com >10k)
  if (followers > 10_000 && engagementRate < 2) {
    tags.push('Bot / Seguidor Fantasma')
    return { score: 10, classification: 'LIXO', tags }
  }

  // 3. Penalidade de Índice de Vaidade (Comentários / Likes < 0.4% indica compra de likes)
  if (inf.suspicious_engagement) {
    tags.push('⚠️ Poucos Comentários (Suspeita Compra de Likes)')
  }

  // 4. Penalidade Agência / Assessoria (Pedro quer "o cara povão / solto")
  if (inf.is_agency) {
    tags.push('Agência / Assessoria')
    return { score: 15, classification: 'LIXO', tags }
  }

  let score = 0

  // +30: Faixa Ideal "Cara Povão" (10k a 120k seguidores)
  if (followers >= 10_000 && followers <= 120_000) {
    score += 30
    tags.push('Faixa Ouro (10k-120k)')
  } else if (followers > 120_000 && followers <= 200_000) {
    score += 15
    tags.push('Grande Porte (120k-200k)')
  }

  // +35: Engajamento alto em Reels/Vídeos (≥15%)
  if (engagementRate >= 15) {
    score += 35
    tags.push('Alto Engajamento Reels')
  } else if (engagementRate >= 7) {
    score += 20
  }

  // +20: WhatsApp comercial detectado
  if (inf.whatsapp) {
    score += 20
    tags.push('WhatsApp Direto')
  }

  // +15: Audiência virgem (nunca postou casa de aposta)
  if (!inf.has_competitor) {
    score += 15
    tags.push('Audiência Virgem')
  } else {
    tags.push(`Divulga ${inf.competitor_name || 'Concorrente'}`)
  }

  // Penalidade Rifa (público sem dinheiro pra depósito)
  if (inf.promotes_raffle) {
    score = Math.max(0, score - 30)
    tags.push('⚠️ Promove Rifa')
  }

  // Penalidade Achadinhos / Shopee
  if (inf.promotes_shopee) {
    score = Math.max(0, score - 20)
    tags.push('⚠️ Achadinhos / Shopee')
  }

  // Penalidade de engajamento suspeito
  if (inf.suspicious_engagement) {
    score = Math.max(0, score - 15)
  }

  // Classificação final
  let classification
  if (score >= 75) classification = 'OURO'
  else if (score >= 50) classification = 'PRATA'
  else if (score >= 30) classification = 'BRONZE'
  else classification = 'LIXO'

  return { score, classification, tags }
}

module.exports = { calculateScore, calculateTrimmedMedian, UNDERAGE_TERMS }

