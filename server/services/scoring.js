/**
 * calculateScore — motor refinado com o Playbook do Pedro
 * @param {Object} inf - influencer object
 * @returns {{ score: number, classification: string, tags: string[] }}
 */
function calculateScore(inf) {
  const followers = inf.followers_count || 0
  const engagementRate = followers > 0 ? (inf.engagement_rate || 0) : 0
  const tags = []

  // 1. Penalidade Anti-Bot: seguidores comprados / fantasma
  if (followers > 10_000 && engagementRate < 2) {
    tags.push('Bot / Seguidor Fantasma')
    return { score: 10, classification: 'LIXO', tags }
  }

  // 2. Penalidade Agência / Assessoria (Pedro quer "o cara povão / solto")
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

  // +35: Engajamento alto em Reels (≥15%)
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

  // Classificação final
  let classification
  if (score >= 75) classification = 'OURO'
  else if (score >= 50) classification = 'PRATA'
  else if (score >= 30) classification = 'BRONZE'
  else classification = 'LIXO'

  return { score, classification, tags }
}

module.exports = { calculateScore }
