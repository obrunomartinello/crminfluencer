const supabase = require('./supabase')
const { calculateScore } = require('../services/scoring')
const { buildInitialDatabase, formatPhoneBR, normalizeGame } = require('../services/importer')

// Inicialização com dados reais das 3 planilhas do Pedro (.bet.br)
const seed = buildInitialDatabase()

let inMemoryInfluencers = seed.influencers.map((inf, index) => {
  const { score, classification } = calculateScore(inf)
  return {
    id: index + 1,
    ...inf,
    score: inf.score || score,
    classification: inf.classification || classification,
    status: inf.status || 'Novo',
    user_notes: inf.user_notes || '',
    story_views_avg: 0,
    story_clicks_avg: 0,
    story_asking_price: 0,
    estimated_revenue: 0,
    roi_verdict: null,
    created_at: inf.contact_date ? `${inf.contact_date}T12:00:00.000Z` : new Date().toISOString(),
  }
})

let inMemoryPublicidades = [...seed.publicidades]
let inMemoryMetas = [...seed.metas]

let nextId = inMemoryInfluencers.length + 1
let nextPublicidadeId = inMemoryPublicidades.length + 1
let nextMetaId = inMemoryMetas.length + 1

const GAMES = ['Block Win', 'Bubble Win', 'Cust Win', 'Count Masters']

const BASE_FIELDS = [
  'username', 'full_name', 'profile_pic_url', 'bio', 'external_url',
  'followers_count', 'following_count', 'posts_count', 'avg_reels_views',
  'engagement_rate', 'whatsapp', 'email', 'has_competitor', 'competitor_name',
  'niche', 'score', 'classification', 'status', 'user_notes',
  'story_views_avg', 'story_clicks_avg', 'story_asking_price', 'estimated_revenue',
  'roi_verdict', 'paid_amount', 'revenue_generated', 'last_campaign_date',
  'is_agency', 'promotes_raffle', 'promotes_shopee', 'is_ghost', 'campaign_game',
]

const store = {
  isUsingSupabase() {
    return !!supabase
  },

  listGames() {
    return GAMES
  },

  // --- CAPTAÇÃO & DASHBOARD GERAL ---
  async getStats() {
    const total = inMemoryInfluencers.length
    const qualified = inMemoryInfluencers.filter(i => i.classification === 'OURO' || i.classification === 'PRATA').length
    const whatsapps = inMemoryInfluencers.filter(i => i.whatsapp).length
    const closed = inMemoryInfluencers.filter(i => i.status === 'Fechou').length
    const negotiating = inMemoryInfluencers.filter(i => i.status === 'Em negociação' || i.status === 'Abordado').length
    const ghost = inMemoryInfluencers.filter(i => i.is_ghost || i.user_notes?.toLowerCase().includes('ghost')).length

    // Contagem por cada um dos 7 status do Pedro
    const statusCounts = {
      'Sem resposta': 0,
      'Em negociação': 0,
      'Fechou': 0,
      'Não interessado': 0,
      'Recusado - métricas ruins': 0,
      'Recusado - Remarketing': 0,
      'Outro momento': 0,
    }

    for (const inf of inMemoryInfluencers) {
      const s = inf.status?.trim()
      if (statusCounts[s] !== undefined) {
        statusCounts[s]++
      }
    }

    const conversionRate = total > 0 ? Math.round((closed / total) * 1000) / 10 : 0

    return {
      total,
      qualified,
      whatsapps,
      closed,
      negotiating,
      ghost,
      conversionRate,
      statusCounts,
    }
  },

  async listInfluencers({ search, status, classification, minFollowers, hideAgencies, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.max(1, parseInt(limit) || 20)
    const offset = (pageNum - 1) * limitNum

    let filtered = [...inMemoryInfluencers]

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(i =>
        (i.username && i.username.toLowerCase().includes(s)) ||
        (i.full_name && i.full_name.toLowerCase().includes(s)) ||
        (i.campaign_game && i.campaign_game.toLowerCase().includes(s))
      )
    }

    if (status) {
      if (status === 'Remarketing') {
        filtered = filtered.filter(i => i.status === 'Recusado - Remarketing' || i.status === 'Outro momento')
      } else {
        filtered = filtered.filter(i => i.status === status)
      }
    }

    if (classification) {
      filtered = filtered.filter(i => i.classification === classification)
    }

    if (minFollowers) {
      const min = parseInt(minFollowers)
      filtered = filtered.filter(i => (i.followers_count || 0) >= min)
    }

    if (hideAgencies === true || hideAgencies === 'true') {
      filtered = filtered.filter(i => !i.is_agency)
    }

    // Ordenar: Fechados / Ouro primeiro
    filtered.sort((a, b) => (b.score || 0) - (a.score || 0))

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limitNum)

    return {
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    }
  },

  async createInfluencer(body) {
    const username = (body.username || '').toLowerCase().replace(/^@+/, '').trim()
    const existingIndex = inMemoryInfluencers.findIndex(i => i.username === username)

    if (existingIndex !== -1) {
      // Abre o existente
      return inMemoryInfluencers[existingIndex]
    }

    const { score, classification } = calculateScore(body)
    const newRecord = {
      id: nextId++,
      ...body,
      username,
      full_name: body.full_name || username,
      score,
      classification,
      status: body.status || 'Novo',
      user_notes: body.user_notes || '',
      is_ghost: !!body.is_ghost,
      campaign_game: normalizeGame(body.campaign_game),
      created_at: new Date().toISOString(),
    }

    inMemoryInfluencers.unshift(newRecord)
    return newRecord
  },

  async updateInfluencer(id, body) {
    const index = inMemoryInfluencers.findIndex(i => String(i.id) === String(id) || i.username === String(id))
    if (index !== -1) {
      inMemoryInfluencers[index] = { ...inMemoryInfluencers[index], ...body }
      return inMemoryInfluencers[index]
    }
    return null
  },

  async deleteInfluencer(id) {
    const initialLength = inMemoryInfluencers.length
    inMemoryInfluencers = inMemoryInfluencers.filter(i => String(i.id) !== String(id))
    return inMemoryInfluencers.length < initialLength
  },

  async upsertInfluencer(item) {
    const username = (item.username || '').toLowerCase().replace(/^@+/, '').trim()
    if (!username) return false

    const existingIndex = inMemoryInfluencers.findIndex(i => i.username.toLowerCase() === username.toLowerCase())

    if (existingIndex !== -1) {
      inMemoryInfluencers[existingIndex] = {
        ...inMemoryInfluencers[existingIndex],
        ...item,
        username,
      }
    } else {
      inMemoryInfluencers.unshift({
        id: nextId++,
        status: item.status || 'Novo',
        user_notes: item.user_notes || '',
        created_at: new Date().toISOString(),
        ...item,
        username,
      })
    }
    return true
  },

  // --- MÓDULO: PUBLICIDADES (CONTROLE FINANCEIRO) ---
  async listPublicidades({ influencer, game, closureType, deliveryStatus, paymentStatus, page = 1, limit = 50 } = {}) {
    let filtered = [...inMemoryPublicidades]

    if (influencer) {
      const s = influencer.toLowerCase()
      filtered = filtered.filter(p =>
        p.influencer_username.toLowerCase().includes(s) ||
        p.influencer_name.toLowerCase().includes(s)
      )
    }

    if (game) {
      filtered = filtered.filter(p => p.game === game)
    }

    if (closureType) {
      filtered = filtered.filter(p => p.closure_type === closureType)
    }

    if (deliveryStatus) {
      filtered = filtered.filter(p => p.delivery_status === deliveryStatus)
    }

    if (paymentStatus) {
      filtered = filtered.filter(p => p.payment_status === paymentStatus)
    }

    // Ordenar pelas mais recentes
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    const total = filtered.length
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.max(1, parseInt(limit) || 50)
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    return {
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    }
  },

  async getPublicidadesStats() {
    let totalInvested = 0
    let totalReturn = 0
    let totalCommissions = 0
    let costOfReportedAds = 0
    let returnOfReportedAds = 0
    let pendingPayment = 0
    let ghostCount = 0

    for (const p of inMemoryPublicidades) {
      const cost = p.total_cost || (p.invested_amount + (p.referral_commission || 0))
      totalInvested += p.invested_amount || 0
      totalCommissions += p.referral_commission || 0

      if (p.payment_status === 'Pendente') {
        pendingPayment += p.invested_amount || 0
      }

      if (p.delivery_status === 'Ghost') {
        ghostCount++
      }

      if (p.return_amount !== null && p.return_amount !== undefined) {
        totalReturn += p.return_amount
        costOfReportedAds += cost
        returnOfReportedAds += p.return_amount
      }
    }

    const netProfit = totalReturn - (totalInvested + totalCommissions)
    const overallRoi = costOfReportedAds > 0
      ? Math.round(((returnOfReportedAds - costOfReportedAds) / costOfReportedAds) * 1000) / 1000
      : null

    return {
      totalAds: inMemoryPublicidades.length,
      totalInvested,
      totalCommissions,
      totalReturn,
      netProfit,
      overallRoi,
      pendingPayment,
      ghostCount,
    }
  },

  async createPublicidade(body) {
    const invested = parseFloat(body.invested_amount) || 0
    const commission = parseFloat(body.referral_commission) || 0
    const totalCost = invested + commission
    const hasReturn = body.return_amount !== null && body.return_amount !== undefined && body.return_amount !== ''
    const returnVal = hasReturn ? parseFloat(body.return_amount) : null
    const roi = hasReturn && totalCost > 0 ? (returnVal - totalCost) / totalCost : null
    const username = (body.influencer_username || '').toLowerCase().replace(/^@+/, '').trim()

    const newAd = {
      id: nextPublicidadeId++,
      influencer_username: username,
      influencer_name: body.influencer_name || username,
      whatsapp: body.whatsapp || null,
      game: normalizeGame(body.game),
      invested_amount: invested,
      return_amount: returnVal,
      referral_name: body.referral_name || null,
      referral_commission: commission,
      total_cost: totalCost,
      roi: roi,
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      end_date: body.end_date || null,
      closure_type: body.closure_type || 'Fixo',
      target_depositors: body.target_depositors ? parseInt(body.target_depositors) : null,
      delivery_status: body.delivery_status || 'Agendada',
      payment_status: body.payment_status || 'Pendente',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    }

    inMemoryPublicidades.unshift(newAd)

    // Se for por meta de depositantes, já cria a meta vinculada automaticamente
    if (newAd.closure_type === 'Por meta' && newAd.target_depositors > 0) {
      await this.createMeta({
        ad_id: newAd.id,
        influencer_username: username,
        influencer_name: newAd.influencer_name,
        whatsapp: newAd.whatsapp,
        game: newAd.game,
        invested_amount: newAd.invested_amount,
        target_depositors: newAd.target_depositors,
        reached_depositors: 0,
      })
    }

    return newAd
  },

  async updatePublicidade(id, body) {
    const index = inMemoryPublicidades.findIndex(p => String(p.id) === String(id))
    if (index === -1) return null

    const current = inMemoryPublicidades[index]
    const invested = body.invested_amount !== undefined ? parseFloat(body.invested_amount) : current.invested_amount
    const commission = body.referral_commission !== undefined ? parseFloat(body.referral_commission) : current.referral_commission
    const totalCost = invested + commission

    const hasReturn = body.return_amount !== undefined ? (body.return_amount !== null && body.return_amount !== '') : (current.return_amount !== null)
    const returnVal = hasReturn ? parseFloat(body.return_amount !== undefined ? body.return_amount : current.return_amount) : null
    const roi = hasReturn && totalCost > 0 ? (returnVal - totalCost) / totalCost : null

    inMemoryPublicidades[index] = {
      ...current,
      ...body,
      invested_amount: invested,
      referral_commission: commission,
      total_cost: totalCost,
      return_amount: returnVal,
      roi: roi,
    }

    return inMemoryPublicidades[index]
  },

  async deletePublicidade(id) {
    const len = inMemoryPublicidades.length
    inMemoryPublicidades = inMemoryPublicidades.filter(p => String(p.id) !== String(id))
    return inMemoryPublicidades.length < len
  },

  // --- MÓDULO: METAS DE DEPOSITANTES ---
  async listMetas() {
    return inMemoryMetas
  },

  async getMetasStats() {
    let totalTarget = 0
    let totalReached = 0
    let totalInvestedInMetas = 0
    let completedGoals = 0

    for (const m of inMemoryMetas) {
      totalTarget += m.target_depositors || 0
      totalReached += m.reached_depositors || 0
      totalInvestedInMetas += m.invested_amount || 0
      if (m.status === 'Meta atingida' || (m.reached_depositors >= m.target_depositors && m.target_depositors > 0)) {
        completedGoals++
      }
    }

    const overallProgress = totalTarget > 0 ? Math.round((totalReached / totalTarget) * 1000) / 10 : 0
    const avgCpa = totalReached > 0 ? Math.round((totalInvestedInMetas / totalReached) * 100) / 100 : null

    return {
      activeGoals: inMemoryMetas.length,
      completedGoals,
      totalTarget,
      totalReached,
      overallProgress,
      avgCpa,
    }
  },

  async createMeta(body) {
    const target = parseInt(body.target_depositors) || 0
    const reached = parseInt(body.reached_depositors) || 0
    const invested = parseFloat(body.invested_amount) || 0
    const remaining = Math.max(target - reached, 0)
    const progressPct = target > 0 ? reached / target : 0
    const cpa = reached > 0 ? Math.round((invested / reached) * 100) / 100 : null

    const newMeta = {
      id: nextMetaId++,
      ad_id: body.ad_id || null,
      influencer_username: body.influencer_username,
      influencer_name: body.influencer_name || body.influencer_username,
      whatsapp: body.whatsapp || null,
      game: normalizeGame(body.game),
      invested_amount: invested,
      target_depositors: target,
      reached_depositors: reached,
      remaining_depositors: remaining,
      progress_pct: progressPct,
      cpa: cpa,
      status: reached >= target && target > 0 ? 'Meta atingida' : 'Em andamento',
      last_updated: new Date().toISOString().split('T')[0],
      history: [{ date: new Date().toISOString().split('T')[0], reached }],
    }

    inMemoryMetas.unshift(newMeta)
    return newMeta
  },

  async updateMeta(id, body) {
    const index = inMemoryMetas.findIndex(m => String(m.id) === String(id))
    if (index === -1) return null

    const current = inMemoryMetas[index]
    const target = body.target_depositors !== undefined ? parseInt(body.target_depositors) : current.target_depositors
    const reached = body.reached_depositors !== undefined ? parseInt(body.reached_depositors) : current.reached_depositors
    const invested = body.invested_amount !== undefined ? parseFloat(body.invested_amount) : current.invested_amount

    const remaining = Math.max(target - reached, 0)
    const progressPct = target > 0 ? reached / target : 0
    const cpa = reached > 0 ? Math.round((invested / reached) * 100) / 100 : null

    inMemoryMetas[index] = {
      ...current,
      ...body,
      target_depositors: target,
      reached_depositors: reached,
      remaining_depositors: remaining,
      progress_pct: progressPct,
      cpa: cpa,
      status: reached >= target && target > 0 ? 'Meta atingida' : (body.status || current.status),
      last_updated: new Date().toISOString().split('T')[0],
    }

    return inMemoryMetas[index]
  },

  async incrementMeta(id, incrementAmount = 1) {
    const index = inMemoryMetas.findIndex(m => String(m.id) === String(id))
    if (index === -1) return null

    const current = inMemoryMetas[index]
    const newReached = (current.reached_depositors || 0) + parseInt(incrementAmount)
    const target = current.target_depositors || 0
    const remaining = Math.max(target - newReached, 0)
    const progressPct = target > 0 ? newReached / target : 0
    const cpa = newReached > 0 ? Math.round((current.invested_amount / newReached) * 100) / 100 : null

    const history = Array.isArray(current.history) ? [...current.history] : []
    history.push({ date: new Date().toISOString().split('T')[0], reached: newReached })

    inMemoryMetas[index] = {
      ...current,
      reached_depositors: newReached,
      remaining_depositors: remaining,
      progress_pct: progressPct,
      cpa: cpa,
      status: newReached >= target && target > 0 ? 'Meta atingida' : current.status,
      last_updated: new Date().toISOString().split('T')[0],
      history,
    }

    return inMemoryMetas[index]
  },

  // --- PERFIL UNIFICADO DO INFLUENCIADOR ---
  async getInfluencerFullProfile(usernameOrId) {
    const cleanUsername = String(usernameOrId).toLowerCase().replace(/^@+/, '').trim()
    const inf = inMemoryInfluencers.find(i =>
      String(i.id) === cleanUsername || (i.username && i.username.toLowerCase() === cleanUsername)
    )

    if (!inf) return null

    const u = inf.username.toLowerCase()
    const publicidades = inMemoryPublicidades.filter(p => p.influencer_username.toLowerCase() === u)
    const metas = inMemoryMetas.filter(m => m.influencer_username.toLowerCase() === u)

    let totalInvested = 0
    let totalReturned = 0
    let totalCostReported = 0
    let totalReturnReported = 0
    let reachedDepositorsTotal = 0

    for (const p of publicidades) {
      totalInvested += p.invested_amount || 0
      if (p.return_amount !== null && p.return_amount !== undefined) {
        totalReturned += p.return_amount
        totalCostReported += p.total_cost || p.invested_amount
        totalReturnReported += p.return_amount
      }
    }

    for (const m of metas) {
      reachedDepositorsTotal += m.reached_depositors || 0
    }

    const accumulatedRoi = totalCostReported > 0
      ? Math.round(((totalReturnReported - totalCostReported) / totalCostReported) * 1000) / 1000
      : null

    return {
      influencer: inf,
      publicidades,
      metas,
      metrics: {
        totalInvested,
        totalReturned,
        accumulatedRoi,
        totalAds: publicidades.length,
        totalMetas: metas.length,
        reachedDepositorsTotal,
        isGhost: inf.is_ghost || publicidades.some(p => p.delivery_status === 'Ghost'),
      },
    }
  },

  // Reseta para dados limpos originais do Pedro caso o usuário solicite
  resetToPedroSeed() {
    const fresh = buildInitialDatabase()
    inMemoryInfluencers = fresh.influencers.map((inf, idx) => ({ id: idx + 1, ...inf }))
    inMemoryPublicidades = [...fresh.publicidades]
    inMemoryMetas = [...fresh.metas]
    return {
      influencersCount: inMemoryInfluencers.length,
      publicidadesCount: inMemoryPublicidades.length,
      metasCount: inMemoryMetas.length,
    }
  },
}

module.exports = store
