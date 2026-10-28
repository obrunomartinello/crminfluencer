const supabase = require('./supabase')
const { calculateScore } = require('../services/scoring')
const { MOCK_INFLUENCERS } = require('../services/apify')

// In-memory fallback inicializado com dados mock pontuados
let inMemoryInfluencers = MOCK_INFLUENCERS.map((inf, index) => {
  const { score, classification } = calculateScore(inf)
  return {
    id: index + 1,
    ...inf,
    score,
    classification,
    status: 'Novo',
    user_notes: '',
    story_views_avg: 0,
    story_clicks_avg: 0,
    story_asking_price: 0,
    estimated_revenue: 0,
    roi_verdict: null,
    created_at: new Date().toISOString(),
  }
})
let nextId = inMemoryInfluencers.length + 1

const BASE_FIELDS = [
  'username', 'full_name', 'profile_pic_url', 'bio', 'external_url',
  'followers_count', 'following_count', 'posts_count', 'avg_reels_views',
  'engagement_rate', 'whatsapp', 'email', 'has_competitor', 'competitor_name',
  'niche', 'score', 'classification', 'status', 'user_notes',
  'story_views_avg', 'story_clicks_avg', 'story_asking_price', 'estimated_revenue',
  'roi_verdict', 'paid_amount', 'revenue_generated', 'last_campaign_date',
  'is_agency', 'promotes_raffle', 'promotes_shopee',
]

const CORE_FIELDS = [
  'username', 'full_name', 'profile_pic_url', 'bio', 'external_url',
  'followers_count', 'following_count', 'posts_count', 'avg_reels_views',
  'engagement_rate', 'whatsapp', 'email', 'has_competitor', 'competitor_name',
  'niche', 'score', 'classification', 'status', 'user_notes',
]

const store = {
  isUsingSupabase() {
    return !!supabase
  },

  async getStats() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('influencers')
          .select('classification, status, whatsapp')

        if (!error && data) {
          const total = data.length
          const qualified = data.filter(i => i.classification === 'OURO' || i.classification === 'PRATA').length
          const whatsapps = data.filter(i => i.whatsapp).length
          const negotiating = data.filter(i => i.status === 'Abordado' || i.status === 'Negociando').length
          const closed = data.filter(i => i.status === 'Fechado').length
          return { total, qualified, whatsapps, negotiating, closed }
        }
      } catch (err) {
        console.warn('[store] Falha ao consultar Supabase stats, usando fallback em memória:', err.message)
      }
    }

    // In-memory fallback
    const total = inMemoryInfluencers.length
    const qualified = inMemoryInfluencers.filter(i => i.classification === 'OURO' || i.classification === 'PRATA').length
    const whatsapps = inMemoryInfluencers.filter(i => i.whatsapp).length
    const negotiating = inMemoryInfluencers.filter(i => i.status === 'Abordado' || i.status === 'Negociando').length
    const closed = inMemoryInfluencers.filter(i => i.status === 'Fechado').length
    return { total, qualified, whatsapps, negotiating, closed }
  },

  async listInfluencers({ search, status, classification, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.max(1, parseInt(limit) || 20)
    const offset = (pageNum - 1) * limitNum

    if (supabase) {
      try {
        let query = supabase
          .from('influencers')
          .select('*', { count: 'exact' })
          .order('score', { ascending: false })
          .range(offset, offset + limitNum - 1)

        if (search) {
          query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
        }
        if (status) {
          query = query.eq('status', status)
        }
        if (classification) {
          query = query.eq('classification', classification)
        }

        const { data, error, count } = await query
        if (!error && data) {
          return {
            data,
            total: count || 0,
            page: pageNum,
            totalPages: Math.ceil((count || 0) / limitNum) || 1,
          }
        }
      } catch (err) {
        console.warn('[store] Falha ao listar do Supabase, usando fallback em memória:', err.message)
      }
    }

    // In-memory fallback
    let filtered = [...inMemoryInfluencers]

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(i =>
        (i.username && i.username.toLowerCase().includes(s)) ||
        (i.full_name && i.full_name.toLowerCase().includes(s))
      )
    }

    if (status) {
      filtered = filtered.filter(i => i.status === status)
    }

    if (classification) {
      filtered = filtered.filter(i => i.classification === classification)
    }

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
    const { score, classification } = calculateScore(body)
    const newRecord = {
      ...body,
      score,
      classification,
      status: body.status || 'Novo',
      user_notes: body.user_notes || '',
      created_at: new Date().toISOString(),
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('influencers')
          .insert(newRecord)
          .select()
          .single()

        if (!error && data) return data

        // Fallback para campos básicos caso colunas novas ainda não existam no Supabase
        const coreRecord = {}
        for (const k of CORE_FIELDS) {
          if (newRecord[k] !== undefined) coreRecord[k] = newRecord[k]
        }
        const { data: dCore, error: errCore } = await supabase
          .from('influencers')
          .insert(coreRecord)
          .select()
          .single()

        if (!errCore && dCore) return { ...dCore, ...newRecord }
      } catch (err) {
        console.warn('[store] Erro ao inserir no Supabase, salvando em memória:', err.message)
      }
    }

    const created = { id: nextId++, ...newRecord }
    inMemoryInfluencers.unshift(created)
    return created
  },

  async updateInfluencer(id, body) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('influencers')
          .update(body)
          .eq('id', id)
          .select()
          .single()

        if (!error && data) return data
        // Se deu erro de coluna não existente no Supabase, tenta atualizar somente campos base
        const cleanBody = {}
        for (const k of Object.keys(body)) {
          if (BASE_FIELDS.includes(k)) cleanBody[k] = body[k]
        }
        const { data: d2, error: e2 } = await supabase
          .from('influencers')
          .update(cleanBody)
          .eq('id', id)
          .select()
          .single()

        if (!e2 && d2) return { ...d2, ...body }
      } catch (err) {
        console.warn('[store] Erro ao atualizar no Supabase, atualizando em memória:', err.message)
      }
    }

    const index = inMemoryInfluencers.findIndex(i => String(i.id) === String(id))
    if (index !== -1) {
      inMemoryInfluencers[index] = { ...inMemoryInfluencers[index], ...body }
      return inMemoryInfluencers[index]
    }
    return null
  },

  async deleteInfluencer(id) {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('influencers')
          .delete()
          .eq('id', id)

        if (!error) return true
      } catch (err) {
        console.warn('[store] Erro ao deletar no Supabase, removendo em memória:', err.message)
      }
    }

    const initialLength = inMemoryInfluencers.length
    inMemoryInfluencers = inMemoryInfluencers.filter(i => String(i.id) !== String(id))
    return inMemoryInfluencers.length < initialLength
  },

  async upsertInfluencer(item) {
    if (supabase) {
      try {
        // Tenta upsert com todos os campos
        const { error } = await supabase
          .from('influencers')
          .upsert(item, { onConflict: 'username' })

        if (!error) return true

        // Se falhou (ex: coluna nova ainda não criada no schema do Supabase), faz fallback para os campos padrão
        const baseItem = {}
        for (const k of BASE_FIELDS) {
          if (item[k] !== undefined) baseItem[k] = item[k]
        }
        const { error: errBase } = await supabase
          .from('influencers')
          .upsert(baseItem, { onConflict: 'username' })

        if (!errBase) return true
        console.warn('[store] Erro upsert Supabase:', errBase.message)
      } catch (err) {
        console.warn('[store] Erro upsert Supabase, salvando em memória:', err.message)
      }
    }

    const existingIndex = inMemoryInfluencers.findIndex(
      i => i.username && i.username.toLowerCase() === item.username.toLowerCase()
    )

    if (existingIndex !== -1) {
      inMemoryInfluencers[existingIndex] = {
        ...inMemoryInfluencers[existingIndex],
        ...item,
      }
    } else {
      inMemoryInfluencers.unshift({
        id: nextId++,
        status: 'Novo',
        user_notes: '',
        created_at: new Date().toISOString(),
        ...item,
      })
    }
    return true
  },
}

module.exports = store
