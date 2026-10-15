require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const MOCK_INFLUENCERS = [
  {
    username: 'futeboldapaixao',
    full_name: 'Pedro Gol',
    profile_pic_url: 'https://i.pravatar.cc/150?img=11',
    bio: 'Futebol é vida 🏆 | Apostas esportivas | Parceiro @blaze',
    external_url: null,
    followers_count: 87000,
    following_count: 412,
    posts_count: 340,
    avg_reels_views: 22000,
    engagement_rate: 25.29,
    whatsapp: null,
    has_competitor: true,
    competitor_name: 'blaze',
    niche: 'Esportes',
  },
  {
    username: 'cassitips_oficial',
    full_name: 'Cassi Dicas',
    profile_pic_url: 'https://i.pravatar.cc/150?img=22',
    bio: 'Dicas quentes de apostas 🎯 | Link p/ contato 👇',
    external_url: 'https://linktr.ee/cassitips',
    followers_count: 54000,
    following_count: 890,
    posts_count: 210,
    avg_reels_views: 11200,
    engagement_rate: 20.74,
    whatsapp: '5511988776655',
    has_competitor: false,
    competitor_name: null,
    niche: 'Cassino',
  },
  {
    username: 'marcogolden_',
    full_name: 'Marco Golden',
    profile_pic_url: 'https://i.pravatar.cc/150?img=33',
    bio: 'Influencer de estilo de vida | Viagens | Parceiro Betano',
    external_url: null,
    followers_count: 110000,
    following_count: 1230,
    posts_count: 560,
    avg_reels_views: 3800,
    engagement_rate: 3.45,
    whatsapp: null,
    has_competitor: true,
    competitor_name: 'betano',
    niche: 'Lifestyle',
  },
  {
    username: 'apostacomciencia',
    full_name: 'Rafael Ciência',
    profile_pic_url: 'https://i.pravatar.cc/150?img=44',
    bio: 'Trader esportivo | CPA alto | WhatsApp na bio',
    external_url: null,
    followers_count: 32000,
    following_count: 287,
    posts_count: 145,
    avg_reels_views: 7400,
    engagement_rate: 23.13,
    whatsapp: '5521997654321',
    has_competitor: false,
    competitor_name: null,
    niche: 'Apostas',
  },
  {
    username: 'mikebethero',
    full_name: 'Mike Bet',
    profile_pic_url: 'https://i.pravatar.cc/150?img=55',
    bio: 'Apostador profissional | 200k seguidores | Resultados reais',
    external_url: null,
    followers_count: 200000,
    following_count: 50,
    posts_count: 1200,
    avg_reels_views: 800,
    engagement_rate: 0.4, // bot penalty trigger
    whatsapp: null,
    has_competitor: false,
    competitor_name: null,
    niche: 'Apostas',
  },
]

/**
 * Mapeia resultado do Apify para o schema do influenciador
 * Null-coalece todos os campos para evitar erros
 */
function mapActorResult(item) {
  const followersCount = item.followersCount || item.followers_count || 0
  const latestReels = item.latestReels || item.reels || []
  const avgReelsViews = latestReels.length > 0
    ? Math.round(latestReels.slice(0, 5).reduce((sum, r) => sum + (r.videoPlayCount || r.viewCount || 0), 0) / Math.min(latestReels.length, 5))
    : (item.avgReelsViews || item.avg_reels_views || 0)

  const engagementRate = followersCount > 0
    ? Math.round((avgReelsViews / followersCount) * 10000) / 100
    : 0

  return {
    username: item.username || item.ownerUsername || null,
    full_name: item.fullName || item.full_name || null,
    profile_pic_url: item.profilePicUrl || item.profile_pic_url || null,
    bio: item.biography || item.bio || null,
    external_url: item.externalUrl || item.external_url || null,
    followers_count: followersCount,
    following_count: item.followsCount || item.following_count || 0,
    posts_count: item.postsCount || item.posts_count || 0,
    avg_reels_views: avgReelsViews,
    engagement_rate: engagementRate,
    niche: item.niche || 'Geral',
  }
}

/**
 * Executa o actor Apify para minerar influenciadores
 * @param {string} query - hashtag ou nicho
 * @param {number} count - quantidade de perfis
 * @returns {Promise<Object[]>}
 */
async function runMiningActor(query, count) {
  if (!process.env.APIFY_TOKEN) {
    console.warn('[apify] APIFY_TOKEN não configurado — retornando mock data')
    return MOCK_INFLUENCERS.slice(0, count).map(i => ({ ...i }))
  }

  const { ApifyClient } = require('apify-client')
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN })
  const actorId = process.env.APIFY_ACTOR_ID || 'apify/instagram-hashtag-scraper'

  console.log(`[apify] Rodando actor ${actorId} para query: "${query}", count: ${count}`)

  const run = await client.actor(actorId).call({
    hashtags: [query],
    resultsLimit: count,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return items.map(mapActorResult).filter(i => i.username)
}

module.exports = { runMiningActor, MOCK_INFLUENCERS }
