// server/services/scoring.js

const STORY_CLICK_VALUE_BRL = 16.0

// 1. LISTAS DE HEURÍSTICAS (PLAYBOOK DO PEDRO)
const KEYWORDS = {
  // Bloqueio / Penalidade Severa (Risco Regulatório SPA/MF ou Sem Retorno)
  minorOrRisk: [
    '14y', '15y', '16y', '17y', 'roblox', 'free fire', 'freefire',
    'brawl stars', 'minecraft', 'escola', 'enem', 'vestibulando', 'kids', 'infantil',
    'colegio', 'colégio', 'terceirao', 'terceirão', 'ensino médio', 'ensino medio',
  ],
  rifaOrScam: [
    'rifa', 'rifas', 'sorteio', 'sorteios', 'ação entre amigos',
    'acao entre amigos', 'cota', 'cotas', 'federal', 'premiações', 'ganhador',
  ],
  agencyBlock: [
    'agência', 'agencia', 'assessoria', 'casting', 'management',
    'talents', 'produtora', 'publicidade e imprensa', 'agenciamento',
    'assessoriadeimprensa', 'comercial@', 'contato@',
  ],
  // Páginas sem rosto (CTR baixo em Stories)
  facelessPages: [
    'cortes', 'memes', 'meme', 'fofoca', 'fofocas', 'notícias', 'noticias',
    'achadinhos', 'achados', 'promoções', 'promocoes', 'ofertas', 'cupons',
    'página', 'pagina', 'portal', 'central', 'fã clube', 'fanpage', 'edits',
  ],
  // Sinais de "Bom dia ao Boa noite" / Caixinha / Humano Real
  storytellerSignals: [
    'rotina', 'dia a dia', 'vida real', 'realidade', 'maternidade',
    'lifestyle', 'humor', 'comédia', 'comedia', 'vlog', 'resenha',
    'interior', 'roça', 'várzea', 'varzea', 'churrasco', 'grau', 'sinuca',
  ],
  // Maturidade Comercial (Público que já clica e paga no Pix)
  affiliateSignals: [
    'shopee', 'mercadolivre', 'mercado livre', 'shein', 'amazon',
    'magalu', 'aliexpress', 'minha loja', 'meus achados', 'favoritos',
  ],
  funnelSignals: [
    'grupo vip', 'telegram', 'comunidade', 'cupom', 'desconto',
    'parceiros', 'plataforma', 'link oficial', 'acessar agora',
  ],
}

/**
 * Calcula a mediana de um array numérico para eliminar distorção de Reels virais
 */
function calculateMedian(values) {
  if (!values || values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/**
 * Calcula a Mediana Recortada (descarta o maior e o menor outlier se houver >= 6 posts)
 */
function calculateTrimmedMedian(values) {
  if (!values || values.length === 0) return 0
  if (values.length < 6) return calculateMedian(values)
  const sorted = [...values].sort((a, b) => a - b)
  const trimmed = sorted.slice(1, sorted.length - 1)
  return calculateMedian(trimmed)
}

function matchesAny(text = '', wordList = []) {
  const normalized = text.toLowerCase()
  return wordList.filter((word) => normalized.includes(word))
}

/**
 * Avalia se o perfil pertence a uma pessoa real (Rosto + Voz) vs. Página/Repost
 */
function evaluateHumanCreator(profile) {
  const bio = (profile.biography || '').toLowerCase()
  const fullName = (profile.fullName || '').trim()
  const username = (profile.username || '').toLowerCase()
  const highlightsCount = profile.highlightReelCount || 0

  const facelessHits = matchesAny(`${fullName} ${bio} ${username}`, KEYWORDS.facelessPages)
  const storytellerHits = matchesAny(`${fullName} ${bio}`, KEYWORDS.storytellerSignals)

  const hasRealNameFormat =
    fullName.length >= 3 &&
    facelessHits.length === 0 &&
    !/^(portal|central|pagina|página|memes|cortes|achadinhos)/i.test(fullName)

  const hasStrongHighlights = highlightsCount >= 4

  const isHumanCreator =
    facelessHits.length === 0 && (hasRealNameFormat || hasStrongHighlights || storytellerHits.length > 0)

  return {
    isHumanCreator,
    facelessHits,
    storytellerHits,
    hasStrongHighlights,
    hasRealNameFormat,
  }
}

/**
 * Analisa consistência dos últimos posts/Reels e detecta "One-Hit Wonders" (Viral de Explorar)
 */
function analyzeEngagementConsistency(profile) {
  const posts = Array.isArray(profile.latestPosts) ? profile.latestPosts.slice(0, 12) : []
  const followers = profile.followersCount || 1

  if (posts.length === 0) {
    const fallbackViews = profile.avgReelsViews || 0
    return {
      medianViews: fallbackViews,
      medianInteractions: Math.round(fallbackViews * 0.1),
      maxViews: fallbackViews,
      asymmetryRatio: 1,
      isOneHitWonder: false,
      commentToLikeRatio: 1.0,
      engagementRateMedian: profile.engagementRate || 0,
    }
  }

  const viewCounts = []
  const interactionCounts = []
  let totalLikes = 0
  let totalComments = 0

  for (const post of posts) {
    const likes = Math.max(0, post.likesCount || 0)
    const comments = Math.max(0, post.commentsCount || 0)
    const views = post.videoViewCount || post.videoPlayCount || Math.round(likes * 8.5)

    viewCounts.push(views)
    interactionCounts.push(likes + comments * 3)
    totalLikes += likes
    totalComments += comments
  }

  const medianViews = calculateTrimmedMedian(viewCounts)
  const medianInteractions = calculateTrimmedMedian(interactionCounts)
  const maxViews = Math.max(...viewCounts, 0)

  const asymmetryRatio = medianViews > 0 ? Number((maxViews / medianViews).toFixed(1)) : 1
  const isOneHitWonder = asymmetryRatio > 10 && (medianViews / followers) < 0.08

  const commentToLikeRatio = totalLikes > 0 ? Number(((totalComments / totalLikes) * 100).toFixed(2)) : 0
  const engagementRateMedian = Number(((medianInteractions / followers) * 100).toFixed(2))

  return {
    medianViews,
    medianInteractions,
    maxViews,
    asymmetryRatio,
    isOneHitWonder,
    commentToLikeRatio,
    engagementRateMedian,
  }
}

/**
 * Calcula a Projeção Realista de Views e Cliques nos Stories + Faturamento (Cliques x R$ 16,00)
 */
function buildStoryProjection(followers, engagement, humanAudit, hasCommercialMaturity, _finalScore) {
  const baseFromMedian = engagement.medianViews > 0
    ? Math.round(engagement.medianViews * 0.22)
    : Math.round(followers * 0.04)

  const ceilingFromFollowers = Math.round(followers * 0.14)
  let estimatedStoryViews = Math.min(baseFromMedian, ceilingFromFollowers)

  if (!humanAudit.isHumanCreator) {
    estimatedStoryViews = Math.round(estimatedStoryViews * 0.55)
  }

  let estimatedCtr = 0.006
  if (humanAudit.isHumanCreator) {
    estimatedCtr = hasCommercialMaturity ? 0.024 : 0.015
  }

  const estimatedStoryClicks = Math.max(1, Math.round(estimatedStoryViews * estimatedCtr))
  const projectedRevenueBRL = Number((estimatedStoryClicks * STORY_CLICK_VALUE_BRL).toFixed(2))
  const suggestedMaxCacheBRL = Math.round(projectedRevenueBRL * 0.35)

  return {
    medianReelsViews: engagement.medianViews,
    maxReelsViews: engagement.maxViews,
    asymmetryRatio: engagement.asymmetryRatio,
    isOneHitWonder: engagement.isOneHitWonder,
    estimatedStoryViews,
    estimatedCtrPercent: Number((estimatedCtr * 100).toFixed(1)),
    estimatedStoryClicks,
    projectedRevenueBRL,
    suggestedMaxCacheBRL,
  }
}

/**
 * Calcula o Score (0-100) + Projeção Financeira de Stories (Fórmula do Pedro: Cliques x R$ 16)
 */
function calculateInfluencerScore(profile, linktreeData = {}) {
  let score = 50
  const positives = []
  const redFlags = []
  const tags = []

  const followers = profile.followersCount || 0
  const bio = profile.biography || ''
  const externalUrl = profile.externalUrl || ''
  const linktreeText = `${externalUrl} ${(linktreeData.rawText || '')} ${(linktreeData.links || []).join(' ')}`

  // 1. AUDITORIA HUMANO vs PÁGINA E CONSISTÊNCIA
  const humanAudit = evaluateHumanCreator(profile)
  const engagement = analyzeEngagementConsistency(profile)

  // 2. TRAVAS REGULATÓRIAS E BLOQUEADORES (.bet.br)
  const minorHits = matchesAny(bio, KEYWORDS.minorOrRisk)
  if (minorHits.length > 0) {
    return {
      score: 0,
      classification: 'LIXO',
      tier: 'BLOQUEADO_COMPLIANCE',
      positives: [],
      redFlags: [`Risco Regulatório +18 (${minorHits.join(', ')})`],
      tags: ['RISCO_MENOR', '🚫 Risco SPA/MF'],
      metrics: buildStoryProjection(followers, engagement, humanAudit, false, 0),
    }
  }

  const rifaHits = matchesAny(`${bio} ${linktreeText}`, KEYWORDS.rifaOrScam)
  if (rifaHits.length > 0) {
    score -= 40
    redFlags.push(`Perfil de Rifa/Sorteio (${rifaHits[0]}) — público viciado em centavos`)
    tags.push('RIFA')
  }

  const agencyHits = matchesAny(bio, KEYWORDS.agencyBlock)
  if (agencyHits.length > 0) {
    score -= 20
    redFlags.push(`Intermediado por Agência/Assessoria (${agencyHits[0]})`)
    tags.push('AGENCIA')
  }

  // 3. SWEET SPOT DE SEGUIDORES (10k - 120k)
  if (followers >= 10000 && followers <= 120000) {
    score += 15
    positives.push(`Sweet Spot de seguidores (${(followers / 1000).toFixed(1)}k) — Custo/Benefício ideal`)
    tags.push('SWEET_SPOT')
  } else if (followers > 120000 && followers <= 220000) {
    score += 5
    positives.push(`Médio Porte (${(followers / 1000).toFixed(1)}k) — exige negociação firme`)
  } else if (followers >= 5000 && followers < 10000) {
    score += 0
  } else {
    score -= 20
    redFlags.push(`Fora da faixa de escala (${(followers / 1000).toFixed(1)}k seguidores)`)
  }

  // 4. DETECTOR DE ROSTO/VOZ + ROTINA ("Bom dia ao Boa noite" & Caixinha)
  if (humanAudit.isHumanCreator) {
    score += 20
    positives.push('Criador Real (Rosto + Voz) — alta conversão em Stories')
    tags.push('CRIADOR_REAL')

    if (humanAudit.hasStrongHighlights) {
      score += 5
      positives.push(`${profile.highlightReelCount || 4} Destaques ativos (sinal de Stories constantes/caixinha)`)
    }
    if (humanAudit.storytellerHits.length > 0) {
      score += 8
      positives.push(`Nicho de Rotina/Conexão (${humanAudit.storytellerHits.slice(0, 2).join(', ')})`)
    }
  } else {
    score -= 25
    redFlags.push(`Página sem rosto / Repost (${humanAudit.facelessHits.slice(0, 2).join(', ') || 'Genérico'})`)
    tags.push('PAGINA_REPOST')
  }

  // 5. NOVA REGRA SHOPEE / AFILIADOS (Separando Criador Real de Achadinhos)
  const affiliateHits = matchesAny(`${bio} ${linktreeText}`, KEYWORDS.affiliateSignals)
  const funnelHits = matchesAny(`${bio} ${linktreeText}`, KEYWORDS.funnelSignals)
  const hasCommercialMaturity = affiliateHits.length > 0 || funnelHits.length > 0

  if (affiliateHits.length > 0) {
    if (humanAudit.isHumanCreator) {
      score += 12
      positives.push(`Criador Real c/ Afiliado (${affiliateHits[0]}) — audiência já clica em link e paga no Pix`)
      tags.push('AUDIENCIA_COMPRADORA')
    } else {
      score -= 30
      redFlags.push(`Página de Achadinhos/Cupom (${affiliateHits[0]}) — público caçador de oferta barata`)
      tags.push('ACHADINHOS_DESCARTAR')
    }
  }

  if (funnelHits.length > 0) {
    score += 10
    positives.push(`Funil externo ativo na bio (${funnelHits.slice(0, 2).join(', ')})`)
    tags.push('FUNIL_ATIVO')
  }

  // 6. CONSISTÊNCIA vs. VIRAL DE EXPLORAR (Penalidade One-Hit Wonder)
  if (engagement.isOneHitWonder) {
    score -= 22
    redFlags.push(
      `Alerta One-Hit Wonder: Pico de ${(engagement.maxViews / 1000).toFixed(1)}k views, mas mediana real é só ${engagement.medianViews} views (Assimetria ${engagement.asymmetryRatio}x)`
    )
    tags.push('VIRAL_ISOLADO')
  } else if (engagement.medianViews >= followers * 0.15) {
    score += 15
    positives.push(
      `Comunidade Fiel: Mediana sólida de ${(engagement.medianViews / 1000).toFixed(1)}k views/Reels (${Math.round((engagement.medianViews / followers) * 100)}% da base)`
    )
    tags.push('COMUNIDADE_FIEL')
  } else if (engagement.medianViews > 0 && engagement.medianViews < followers * 0.03) {
    score -= 15
    redFlags.push(`Cemitério de seguidores: Mediana de apenas ${engagement.medianViews} views para ${(followers / 1000).toFixed(1)}k seguidores`)
  }

  // Auditoria Anti-Bot (Comentários vs Likes)
  if (engagement.commentToLikeRatio > 0 && engagement.commentToLikeRatio < 0.35) {
    score -= 15
    redFlags.push(`Suspeita de compra de likes (Razão Comentários/Likes em ${engagement.commentToLikeRatio}%)`)
    tags.push('SUSPEITA_BOT')
  }

  // 7. WHATSAPP E CONCORRENTES (.bet.br)
  if (linktreeData.whatsapp || profile.whatsapp) {
    score += 10
    positives.push('WhatsApp Comercial capturado automaticamente')
    tags.push('TEM_WHATSAPP')
  }

  if (profile.has_competitor || (Array.isArray(linktreeData.competitors) && linktreeData.competitors.length > 0)) {
    score += 8
    positives.push(`Já divulga concorrente (${profile.competitor_name || linktreeData.competitors?.[0] || 'Concorrente'}) — fácil abordagem de troca/upgrade`)
    tags.push('JA_DIVULGA_BET')
  }

  // Trava score entre 0 e 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)))

  let tier = 'C (Descartar)'
  let classification = 'LIXO'
  if (finalScore >= 80) {
    tier = 'S (Ouro - Abordar Agora)'
    classification = 'OURO'
  } else if (finalScore >= 65) {
    tier = 'A (Qualificado)'
    classification = 'PRATA'
  } else if (finalScore >= 45) {
    tier = 'B (Secundário / Testar Barato)'
    classification = 'BRONZE'
  }

  const metrics = buildStoryProjection(followers, engagement, humanAudit, hasCommercialMaturity, finalScore)

  return {
    score: finalScore,
    classification,
    tier,
    positives,
    redFlags,
    tags,
    metrics,
  }
}

/**
 * Normaliza perfil (snake_case para camelCase) e chama calculateInfluencerScore
 * Garante retrocompatibilidade com store.js e mine.js
 */
function calculateScore(inf, linktreeData = {}) {
  const normalized = {
    username: inf.username,
    fullName: inf.fullName || inf.full_name || inf.username || '',
    biography: inf.biography || inf.bio || '',
    externalUrl: inf.externalUrl || inf.external_url || '',
    followersCount: inf.followersCount || inf.followers_count || 0,
    followingCount: inf.followingCount || inf.following_count || 0,
    postsCount: inf.postsCount || inf.posts_count || 0,
    highlightReelCount: inf.highlightReelCount || inf.highlight_reel_count || (inf.posts_count > 50 ? 5 : 2),
    latestPosts: inf.latestPosts || inf.latest_posts || [],
    avgReelsViews: inf.avgReelsViews || inf.avg_reels_views || 0,
    engagementRate: inf.engagementRate || inf.engagement_rate || 0,
    whatsapp: inf.whatsapp || linktreeData.whatsapp || null,
    has_competitor: inf.has_competitor || inf.hasCompetitor || false,
    competitor_name: inf.competitor_name || inf.competitorName || null,
  }

  return calculateInfluencerScore(normalized, linktreeData)
}

module.exports = {
  calculateScore,
  calculateInfluencerScore,
  calculateMedian,
  calculateTrimmedMedian,
  buildStoryProjection,
  STORY_CLICK_VALUE_BRL,
  KEYWORDS,
}
