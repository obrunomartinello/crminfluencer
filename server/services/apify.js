require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const MOCK_INFLUENCERS = [
  {
    username: 'comediadonordeste',
    full_name: 'Cícero do Piseiro',
    profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Humor de verdade 🌵 | Rotina e zoeira no sertão | Contato p/ shows e parcerias no link 👇',
    external_url: 'https://linktr.ee/ciceropiseiro',
    followers_count: 65000,
    following_count: 512,
    posts_count: 240,
    avg_reels_views: 18500,
    engagement_rate: 28.46,
    whatsapp: '5588998877665',
    has_competitor: false,
    competitor_name: null,
    niche: 'Humor',
    is_agency: false,
    promotes_raffle: false,
    promotes_shopee: false,
  },
  {
    username: 'rafaelresenha_',
    full_name: 'Rafael Resenha',
    profile_pic_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Resenha diária 🍻 | Gandaia e vivência real | Parceiro Blaze',
    external_url: null,
    followers_count: 42000,
    following_count: 640,
    posts_count: 180,
    avg_reels_views: 9200,
    engagement_rate: 21.9,
    whatsapp: '5581987654321',
    has_competitor: true,
    competitor_name: 'blaze',
    niche: 'Gandaia / Vivência',
    is_agency: false,
    promotes_raffle: false,
    promotes_shopee: false,
  },
  {
    username: 'agenciatalentosbrasil',
    full_name: 'Talentos Brasil Assessoria',
    profile_pic_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'Agência de influenciadores e casting comercial. Contato: comercial@talentos.com',
    external_url: 'https://talentosbrasil.ag',
    followers_count: 85000,
    following_count: 1500,
    posts_count: 400,
    avg_reels_views: 1200,
    engagement_rate: 1.41,
    whatsapp: null,
    has_competitor: false,
    competitor_name: null,
    niche: 'Agência',
    is_agency: true,
    promotes_raffle: false,
    promotes_shopee: false,
  },
  {
    username: 'luana_rotinademae',
    full_name: 'Luana Silva | Rotina Real',
    profile_pic_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Maternidade real sem filtro ❤️ | Dia a dia de mãe de 3 | Parcerias chama no zap',
    external_url: 'https://linktr.ee/luanarotina',
    followers_count: 58000,
    following_count: 420,
    posts_count: 310,
    avg_reels_views: 12800,
    engagement_rate: 22.06,
    whatsapp: '5585994433221',
    has_competitor: false,
    competitor_name: null,
    niche: 'Maternidade / Rotina',
    is_agency: false,
    promotes_raffle: false,
    promotes_shopee: false,
  },
  {
    username: 'rifasdomilhao_oficial',
    full_name: 'Prêmios do Sertão',
    profile_pic_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    bio: 'Sorteios de motos e pix semanal 🍀 | Ação entre amigos | Compre sua cota no link',
    external_url: 'https://rifasdopovao.com',
    followers_count: 94000,
    following_count: 200,
    posts_count: 650,
    avg_reels_views: 15000,
    engagement_rate: 15.95,
    whatsapp: '5571991122334',
    has_competitor: false,
    competitor_name: null,
    niche: 'Rifas',
    is_agency: false,
    promotes_raffle: true,
    promotes_shopee: false,
  },
]

const { calculateTrimmedMedian } = require('./scoring')

function normalizeHandle(raw) {
  return String(raw || '').trim().toLowerCase().replace(/^@+/, '')
}

/**
 * Monta input compatível com o schema oficial do apify/instagram-search-scraper
 * (usa `searchLimit`, não `resultsLimit`; `liveSearch: true` para busca real de usuários).
 */
function buildSearchInput(query, count = 25, mode = 'popular') {
  const cleanQuery = String(query || '').replace(/^[@#]+/, '').trim()
  const limit = Math.min(Math.max(parseInt(count) || 25, 5), 50)

  if (mode === 'user') {
    return {
      search: cleanQuery,
      searchType: 'user',
      searchLimit: limit,
      liveSearch: true,
    }
  }

  // Modo padrão: Reels/Conteúdos Populares do nicho — encontra criadores autênticos ativos
  return {
    search: cleanQuery,
    searchType: 'popular',
    searchLimit: limit,
  }
}

/**
 * Extrai e deduplica criadores a partir dos itens brutos da Fase 1 (popular Reels ou liveSearch user).
 * Prioriza criadores que ainda não estão no CRM (`excludeSet`).
 */
function extractCreatorsFromSearchItems(items = [], mode = 'popular', excludeSet = new Set()) {
  const metaByUsername = {}

  const ensureEntry = (username, seed = {}) => {
    if (!username) return null
    if (!metaByUsername[username]) {
      metaByUsername[username] = {
        username,
        fullName: seed.fullName || '',
        profilePicUrl: seed.profilePicUrl || null,
        reelViews: [],
        likes: [],
        comments: [],
        captions: [],
        rawProfile: null,
      }
    }
    const entry = metaByUsername[username]
    if (!entry.fullName && seed.fullName) entry.fullName = seed.fullName
    if (!entry.profilePicUrl && seed.profilePicUrl) entry.profilePicUrl = seed.profilePicUrl
    return entry
  }

  for (const item of items) {
    if (!item || item.error) continue

    // Item de Reel/Post (searchType: 'popular')
    if (item.ownerUsername || item.videoPlayCount !== undefined || item.productType === 'clips') {
      const owner = normalizeHandle(item.ownerUsername || item.username)
      const entry = ensureEntry(owner, {
        fullName: item.ownerFullName || item.fullName,
        profilePicUrl: item.profilePicUrl || item.displayUrl,
      })

      if (entry) {
        const views = item.videoPlayCount || item.videoViewCount || (item.likesCount ? item.likesCount * 8 : 0)
        if (views > 0) entry.reelViews.push(views)
        if (item.likesCount) entry.likes.push(item.likesCount)
        if (item.commentsCount) entry.comments.push(item.commentsCount)
        if (item.caption) entry.captions.push(item.caption)
      }

      // Coautores do Reel (collabs reais no mesmo nicho)
      if (Array.isArray(item.coauthorProducers)) {
        for (const coauthor of item.coauthorProducers) {
          const coUser = normalizeHandle(coauthor.username)
          if (coUser && coUser !== owner) {
            ensureEntry(coUser, {
              fullName: coauthor.full_name || coauthor.fullName,
              profilePicUrl: coauthor.profile_pic_url || coauthor.profilePicUrl,
            })
          }
        }
      }
      continue
    }

    // Item de Usuário (searchType: 'user' com liveSearch ou profile)
    const user = normalizeHandle(item.username)
    if (user) {
      const entry = ensureEntry(user, {
        fullName: item.fullName || item.full_name,
        profilePicUrl: item.profilePicUrlHD || item.profilePicUrl || item.profile_pic_url,
      })
      if (entry && (item.followersCount !== undefined || item.biography)) {
        entry.rawProfile = item
      }
    }
  }

  const allUsernames = Object.keys(metaByUsername)
  const freshUsernames = allUsernames.filter(u => !excludeSet.has(u))

  return {
    allUsernames,
    freshUsernames,
    metaByUsername,
  }
}

/**
 * Mapeia resultado completo do Apify (instagram-profile-scraper ou fallback de search-scraper)
 */
function mapProfileResult(item, stage1Meta = null) {
  const username = normalizeHandle(item.username || item.ownerUsername || stage1Meta?.username)
  const followersCount = item.followersCount || item.followers_count || 0
  const latestPosts = item.latestPosts || item.latestIgtvVideos || []

  const viewsList = [...(stage1Meta?.reelViews || [])]
  let totalLikes = (stage1Meta?.likes || []).reduce((acc, v) => acc + v, 0)
  let totalComments = (stage1Meta?.comments || []).reduce((acc, v) => acc + v, 0)

  for (const post of latestPosts.slice(0, 10)) {
    const views = post.videoViewCount || post.videoPlayCount || (post.likesCount ? post.likesCount * 8 : 0)
    if (views > 0) {
      viewsList.push(views)
    }
    if (post.likesCount) totalLikes += post.likesCount
    if (post.commentsCount) totalComments += post.commentsCount
  }

  // Se o próprio item for um Reel avulso sem latestPosts
  if (viewsList.length === 0 && (item.videoPlayCount || item.videoViewCount)) {
    viewsList.push(item.videoPlayCount || item.videoViewCount)
  }

  const avgReelsViews = viewsList.length > 0
    ? calculateTrimmedMedian(viewsList)
    : (item.avgReelsViews || 0)

  const engagementRate = followersCount > 0
    ? Math.round((avgReelsViews / followersCount) * 10000) / 100
    : 0

  const suspiciousEngagement = totalLikes > 500 && totalComments > 0
    ? (totalComments / totalLikes) < 0.004
    : false

  const sampleCaption = stage1Meta?.captions?.[0] || item.caption || ''
  const bio = item.biography || item.bio || (sampleCaption ? `[Reel] ${sampleCaption.slice(0, 160)}` : '')
  const bioLower = bio.toLowerCase()

  const isAgency = (item.isBusinessAccount && (
    item.businessCategoryName?.toLowerCase().includes('agency') ||
    item.businessCategoryName?.toLowerCase().includes('advertising') ||
    item.businessCategoryName?.toLowerCase().includes('marketing')
  )) || (
    bioLower.includes('assessoria') ||
    bioLower.includes('agência') ||
    bioLower.includes('agencia') ||
    bioLower.includes('casting') ||
    bioLower.includes('management')
  )

  const promotesRaffle = bioLower.includes('rifa') || bioLower.includes('sorteio') || bioLower.includes('cota')
  const promotesShopee = bioLower.includes('achadinho') || bioLower.includes('shopee') || bioLower.includes('amzn.to')

  let directWhatsApp = item.whatsapp || null
  if (!directWhatsApp && Array.isArray(item.externalUrls)) {
    for (const link of item.externalUrls) {
      if (link.link_type === 'whatsapp' || (link.url && link.url.includes('wa.me'))) {
        const m = link.url.match(/(?:wa\.me\/|phone=|\+)(\d{10,14})/)
        if (m) directWhatsApp = m[1]
      }
    }
  }

  const primaryExternalUrl = item.externalUrl
    || (Array.isArray(item.externalUrls) && item.externalUrls[0]?.url)
    || item.externalUrlShimmed
    || null

  const category = item.businessCategoryName && item.businessCategoryName !== 'None'
    ? item.businessCategoryName
    : 'Criador'

  return {
    username,
    full_name: item.fullName || item.ownerFullName || item.full_name || stage1Meta?.fullName || username,
    profile_pic_url: item.profilePicUrlHD || item.profilePicUrl || item.profile_pic_url || stage1Meta?.profilePicUrl || null,
    bio,
    external_url: primaryExternalUrl,
    followers_count: followersCount,
    following_count: item.followsCount || item.following_count || 0,
    posts_count: item.postsCount || (latestPosts ? latestPosts.length : 0),
    avg_reels_views: avgReelsViews,
    engagement_rate: engagementRate,
    whatsapp: directWhatsApp,
    niche: category,
    is_agency: !!isAgency,
    promotes_raffle: !!promotesRaffle,
    promotes_shopee: !!promotesShopee,
    suspicious_engagement: suspiciousEngagement,
    related_profiles: item.relatedProfiles || [],
  }
}

/**
 * Fase 1: Inicia busca assíncrona no Apify (< 800ms)
 * Modos suportados: 'popular' (Reels em alta - padrão), 'user' (Live Search perfis), 'hybrid' (ambos em paralelo)
 */
async function startAsyncSearch(query, count = 25, options = {}) {
  if (!process.env.APIFY_TOKEN) {
    console.warn('[apify] APIFY_TOKEN não configurado — simulando execução com mock data')
    return {
      runId: 'mock-run-' + Date.now(),
      defaultDatasetId: 'mock-dataset',
      runs: [],
      status: 'SUCCEEDED',
      isMock: true,
      items: MOCK_INFLUENCERS.slice(0, count),
    }
  }

  const { ApifyClient } = require('apify-client')
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })
  const mode = options.mode || 'popular'
  const limit = Math.min(Math.max(parseInt(count) || 25, 5), 50)

  console.log(`[apify] Fase 1 (${mode}) para "${query}" (searchLimit: ${limit})`)

  if (mode === 'hybrid') {
    const [popularRun, userRun] = await Promise.all([
      client.actor('apify/instagram-search-scraper').start(buildSearchInput(query, limit, 'popular')),
      client.actor('apify/instagram-search-scraper').start(buildSearchInput(query, Math.min(limit, 20), 'user')),
    ])
    return {
      runId: popularRun.id,
      defaultDatasetId: popularRun.defaultDatasetId,
      runs: [
        { id: popularRun.id, ds: popularRun.defaultDatasetId, mode: 'popular' },
        { id: userRun.id, ds: userRun.defaultDatasetId, mode: 'user' },
      ],
      status: 'RUNNING',
      isMock: false,
    }
  }

  const run = await client.actor('apify/instagram-search-scraper').start(buildSearchInput(query, limit, mode))
  return {
    runId: run.id,
    defaultDatasetId: run.defaultDatasetId,
    runs: [{ id: run.id, ds: run.defaultDatasetId, mode }],
    status: run.status,
    isMock: false,
  }
}

/**
 * Fase 2: Inicia enriquecimento completo de perfis descobertos (seguidores, bio, externalUrl, últimos posts)
 */
async function startProfileEnrichment(usernames = []) {
  const cleanUsernames = [...new Set(usernames.map(normalizeHandle).filter(Boolean))].slice(0, 25)
  if (cleanUsernames.length === 0) {
    return null
  }

  const { ApifyClient } = require('apify-client')
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })

  console.log(`[apify] Fase 2 enriquecendo ${cleanUsernames.length} perfis via instagram-profile-scraper`)

  const run = await client.actor('apify/instagram-profile-scraper').start({
    usernames: cleanUsernames,
    includeAboutSection: false,
  })

  return {
    id: run.id,
    ds: run.defaultDatasetId,
    status: run.status,
  }
}

/**
 * Checa 1 ou mais runs paralelos da Fase 1 no Apify
 */
async function checkRunsStatus(runs = []) {
  if (!process.env.APIFY_TOKEN) {
    return { status: 'SUCCEEDED', items: MOCK_INFLUENCERS }
  }

  const { ApifyClient } = require('apify-client')
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })

  const runInfos = await Promise.all(runs.map(r => client.run(r.id).get()))

  const anyRunning = runInfos.some(info => info && ['READY', 'RUNNING'].includes(info.status))
  if (anyRunning) {
    return { status: 'RUNNING', items: [] }
  }

  const succeededRuns = []
  for (let i = 0; i < runInfos.length; i++) {
    const info = runInfos[i]
    if (info && info.status === 'SUCCEEDED') {
      succeededRuns.push({
        ds: runs[i].ds || info.defaultDatasetId,
        mode: runs[i].mode || 'popular',
      })
    }
  }

  if (succeededRuns.length === 0) {
    const statuses = runInfos.map(r => r?.status || 'UNKNOWN').join(', ')
    return { status: 'FAILED', error: `Scraper finalizado com erro: ${statuses}`, items: [] }
  }

  const datasets = await Promise.all(
    succeededRuns.map(r => client.dataset(r.ds).listItems())
  )

  const combinedItems = []
  for (let i = 0; i < datasets.length; i++) {
    for (const item of datasets[i].items || []) {
      combinedItems.push({ ...item, __searchMode: succeededRuns[i].mode })
    }
  }

  return { status: 'SUCCEEDED', items: combinedItems }
}

/**
 * Checa status de um run único (compatibilidade e Fase 2)
 */
async function checkActorRun(runId, defaultDatasetId, metaByUsername = {}) {
  if (!process.env.APIFY_TOKEN || String(runId).startsWith('mock-run-')) {
    return { status: 'SUCCEEDED', items: MOCK_INFLUENCERS }
  }

  const { ApifyClient } = require('apify-client')
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })

  const run = await client.run(runId).get()
  if (!run) {
    throw new Error(`Execução Apify ID "${runId}" não encontrada`)
  }

  if (run.status === 'SUCCEEDED') {
    const datasetId = defaultDatasetId || run.defaultDatasetId
    const dataset = await client.dataset(datasetId).listItems()
    const profiles = dataset.items
      .map(item => {
        const u = normalizeHandle(item.username || item.ownerUsername)
        return mapProfileResult(item, metaByUsername[u] || null)
      })
      .filter(p => p.username)
    return { status: 'SUCCEEDED', items: profiles }
  }

  if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
    return { status: 'FAILED', error: `Scraper finalizado com status de erro: ${run.status}`, items: [] }
  }

  return { status: 'RUNNING', items: [] }
}

/**
 * Fallback síncrono mantido para compatibilidade
 */
async function runMiningActor(query, count = 25) {
  try {
    const startResult = await startAsyncSearch(query, count, { mode: 'popular' })
    if (startResult.isMock) return startResult.items

    const startTime = Date.now()
    while (Date.now() - startTime < 12000) {
      await new Promise(r => setTimeout(r, 2000))
      const check = await checkActorRun(startResult.runId, startResult.defaultDatasetId)
      if (check.status === 'SUCCEEDED') return check.items
      if (check.status === 'FAILED') break
    }
    return MOCK_INFLUENCERS.slice(0, count)
  } catch (err) {
    console.error('❌ [apify] Erro no fallback de mineração:', err.message)
    return MOCK_INFLUENCERS.slice(0, count)
  }
}

const QUOTA_CACHE_TTL_MS = 30 * 1000
const AVG_COST_PER_SEARCH_USD = 0.06
let quotaCache = null

function clearQuotaCache() {
  quotaCache = null
}

function resolveQuotaLevel(percentRemaining, remainingUsd) {
  if (percentRemaining <= 15 || remainingUsd <= 0.5) return 'critical'
  if (percentRemaining <= 40 || remainingUsd <= 1.5) return 'warning'
  return 'healthy'
}

/**
 * Consulta o saldo e consumo mensal atual na conta Apify (Plano Free = $5.00/mês)
 * @param {{ client?: any, token?: string, forceRefresh?: boolean }} options
 */
async function getQuotaStatus(options = {}) {
  const token = options.token !== undefined ? options.token : process.env.APIFY_TOKEN
  const hasToken = Boolean(token && !String(token).includes('xxxx'))

  if (!options.client && !hasToken) {
    return {
      configured: false,
      plan: 'MOCK',
      username: null,
      limitUsd: 0,
      usedUsd: 0,
      remainingUsd: 0,
      percentUsed: 0,
      percentRemaining: 0,
      estimatedSearchesLeft: 0,
      avgCostPerSearchUsd: AVG_COST_PER_SEARCH_USD,
      cycleStartAt: null,
      cycleEndAt: null,
      level: 'warning',
      fetchedAt: new Date().toISOString(),
    }
  }

  if (!options.forceRefresh && quotaCache && Date.now() - quotaCache.ts < QUOTA_CACHE_TTL_MS) {
    return quotaCache.data
  }

  let client = options.client
  if (!client) {
    const { ApifyClient } = require('apify-client')
    client = new ApifyClient({ token })
  }

  const userRef = client.user('me')
  const [limitsRes, userRes] = await Promise.all([
    userRef.limits(),
    typeof userRef.get === 'function' ? userRef.get().catch(() => null) : Promise.resolve(null),
  ])

  const limitUsd = Number(
    limitsRes?.limits?.maxMonthlyUsageUsd
    ?? userRes?.plan?.maxMonthlyUsageUsd
    ?? userRes?.plan?.monthlyUsageCreditsUsd
    ?? 5
  )
  const usedUsdRaw = Number(limitsRes?.current?.monthlyUsageUsd ?? 0)
  const usedUsd = Number(usedUsdRaw.toFixed(4))
  const remainingUsd = Math.max(0, Number((limitUsd - usedUsdRaw).toFixed(4)))
  const percentUsed = limitUsd > 0 ? Math.min(100, Number(((usedUsdRaw / limitUsd) * 100).toFixed(1))) : 0
  const percentRemaining = Number((100 - percentUsed).toFixed(1))
  const estimatedSearchesLeft = Math.max(0, Math.floor(remainingUsd / AVG_COST_PER_SEARCH_USD))

  const payload = {
    configured: true,
    plan: userRes?.plan?.id || 'FREE',
    username: userRes?.username || null,
    limitUsd,
    usedUsd,
    remainingUsd,
    percentUsed,
    percentRemaining,
    estimatedSearchesLeft,
    avgCostPerSearchUsd: AVG_COST_PER_SEARCH_USD,
    cycleStartAt: limitsRes?.monthlyUsageCycle?.startAt || null,
    cycleEndAt: limitsRes?.monthlyUsageCycle?.endAt || null,
    level: resolveQuotaLevel(percentRemaining, remainingUsd),
    fetchedAt: new Date().toISOString(),
  }

  quotaCache = { ts: Date.now(), data: payload }
  return payload
}

module.exports = {
  buildSearchInput,
  extractCreatorsFromSearchItems,
  startAsyncSearch,
  startProfileEnrichment,
  checkRunsStatus,
  checkActorRun,
  mapProfileResult,
  runMiningActor,
  getQuotaStatus,
  clearQuotaCache,
  MOCK_INFLUENCERS,
}
