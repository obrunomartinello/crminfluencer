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
const supabase = require('../db/supabase')

/**
 * Mapeia resultado completo do Apify (instagram-search-scraper ou instagram-profile-scraper)
 */
function mapProfileResult(item) {
  const followersCount = item.followersCount || item.followers_count || 0
  const latestPosts = item.latestPosts || item.latestIgtvVideos || []
  
  // 1. Extrair visualizações e métricas de engajamento dos últimos posts/Reels
  const viewsList = []
  let totalLikes = 0
  let totalComments = 0

  for (const post of latestPosts.slice(0, 10)) {
    const views = post.videoViewCount || post.videoPlayCount || (post.likesCount ? post.likesCount * 8 : 0)
    if (views > 0) {
      viewsList.push(views)
    }
    if (post.likesCount) totalLikes += post.likesCount
    if (post.commentsCount) totalComments += post.commentsCount
  }

  // Mediana Recortada (Trimmed Median) para evitar distorção de 1 Reels que viralizou no Explorar
  const avgReelsViews = viewsList.length > 0 
    ? calculateTrimmedMedian(viewsList) 
    : (item.avgReelsViews || 0)

  const engagementRate = followersCount > 0
    ? Math.round((avgReelsViews / followersCount) * 10000) / 100
    : 0

  // 2. Detecção de "Índice de Vaidade / Compra de Curtidas":
  // Se tem muitas curtidas mas a razão Comentários / Curtidas < 0.4% (padrão de robôs/engajamento comprado)
  const suspiciousEngagement = totalLikes > 500 && totalComments > 0 
    ? (totalComments / totalLikes) < 0.004
    : false

  const bio = item.biography || item.bio || ''
  const bioLower = bio.toLowerCase()

  // Heurística de Agência no perfil
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

  // Heurística de Rifa
  const promotesRaffle = bioLower.includes('rifa') || bioLower.includes('sorteio') || bioLower.includes('cota')

  // Heurística de Achadinhos
  const promotesShopee = bioLower.includes('achadinho') || bioLower.includes('shopee') || bioLower.includes('amzn.to')

  // Extração direta de WhatsApp de externalUrls (se presente na busca)
  let directWhatsApp = item.whatsapp || null
  if (!directWhatsApp && Array.isArray(item.externalUrls)) {
    for (const link of item.externalUrls) {
      if (link.link_type === 'whatsapp' || (link.url && link.url.includes('wa.me'))) {
        const m = link.url.match(/(?:wa\.me\/|phone=|\+)(\d{10,14})/)
        if (m) directWhatsApp = m[1]
      }
    }
  }

  const primaryExternalUrl = item.externalUrl || (Array.isArray(item.externalUrls) && item.externalUrls[0]?.url) || item.externalUrlShimmed || null

  return {
    username: item.username,
    full_name: item.fullName || item.full_name || item.username,
    profile_pic_url: item.profilePicUrlHD || item.profilePicUrl || item.profile_pic_url || null,
    bio: bio,
    external_url: primaryExternalUrl,
    followers_count: followersCount,
    following_count: item.followsCount || item.following_count || 0,
    posts_count: item.postsCount || (latestPosts ? latestPosts.length : 0),
    avg_reels_views: avgReelsViews,
    engagement_rate: engagementRate,
    whatsapp: directWhatsApp,
    niche: item.businessCategoryName || 'Geral',
    is_agency: !!isAgency,
    promotes_raffle: !!promotesRaffle,
    promotes_shopee: !!promotesShopee,
    suspicious_engagement: suspiciousEngagement,
    related_profiles: item.relatedProfiles || [],
  }
}

/**
 * Inicia execução assíncrona do Apify instagram-search-scraper (< 500ms)
 * @param {string} query Palavra-chave (ex: 'nordeste influencer' ou 'sinuca brasil')
 * @param {number} count Quantidade desejada (5 a 50)
 */
async function startAsyncSearch(query, count = 25) {
  if (!process.env.APIFY_TOKEN) {
    console.warn('[apify] APIFY_TOKEN não configurado — simulando execução com mock data')
    return {
      runId: 'mock-run-' + Date.now(),
      defaultDatasetId: 'mock-dataset',
      status: 'SUCCEEDED',
      isMock: true,
      items: MOCK_INFLUENCERS.slice(0, count),
    }
  }

  const { ApifyClient } = require('apify-client')
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })
  const cleanQuery = query.replace(/^[@#]/, '').trim()

  console.log(`[apify] Disparando busca assíncrona por palavra-chave: "${cleanQuery}" (limite: ${count})`)

  const run = await client.actor('apify/instagram-search-scraper').start({
    search: cleanQuery,
    searchType: 'user',
    resultsLimit: Math.min(Math.max(count, 5), 50),
  })

  return {
    runId: run.id,
    defaultDatasetId: run.defaultDatasetId,
    status: run.status,
    isMock: false,
  }
}

/**
 * Checa status de uma execução de ator no Apify e extrai dados se concluído
 * @param {string} runId ID da execução
 * @param {string} defaultDatasetId ID do dataset padrão
 */
async function checkActorRun(runId, defaultDatasetId) {
  if (!process.env.APIFY_TOKEN || runId.startsWith('mock-run-')) {
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
    const profiles = dataset.items.map(mapProfileResult).filter(p => p.username)
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
    const startResult = await startAsyncSearch(query, count)
    if (startResult.isMock) return startResult.items

    // Polling síncrono rápido (máx 12s para segurança)
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

module.exports = {
  startAsyncSearch,
  checkActorRun,
  mapProfileResult,
  runMiningActor,
  MOCK_INFLUENCERS,
}
