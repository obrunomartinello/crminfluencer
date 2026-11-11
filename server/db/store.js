/**
 * @pilar PILAR 1 — Banco de Dados & Persistência Supabase
 * Centraliza leitura/escrita em memória rápida com sincronização real no Supabase
 * (`influencers`, e `publicidades`/`metas` quando criadas via schema.sql).
 */
const supabase = require('./supabase')
const { calculateScore } = require('../services/scoring')
const { buildInitialDatabase, formatPhoneBR, normalizeGame } = require('../services/importer')

// Inicialização com dados reais das 3 planilhas do Pedro (.bet.br)
const seed = buildInitialDatabase()
const SEED_USERNAMES = new Set(
  seed.influencers.map(i => (i.username || '').toLowerCase().replace(/^@+/, '').trim()).filter(Boolean)
)

function mapSeedInfluencer(inf, index) {
  const followers = parseInt(inf.followers_count, 10) || 0
  const reelsViews = parseInt(inf.avg_reels_views, 10) || 0
  const hasRealMetrics = followers > 0 || reelsViews > 0
  const calculated = hasRealMetrics ? calculateScore(inf) : { score: 0, classification: null }
  const seedDate = inf.contact_date && inf.contact_date < '2026-11-07'
    ? `${inf.contact_date}T12:00:00.000Z`
    : '2026-11-05T12:00:00.000Z'
  return {
    id: index + 1,
    ...inf,
    followers_count: followers,
    score: inf.score || calculated.score || 0,
    classification: inf.classification || calculated.classification || null,
    email: inf.email || null,
    ig_not_found: Boolean(inf.ig_not_found),
    status: inf.status || 'Novo',
    user_notes: inf.user_notes || '',
    story_views_avg: 0,
    story_clicks_avg: 0,
    story_asking_price: 0,
    estimated_revenue: 0,
    roi_verdict: null,
    outreach_channel: inf.outreach_channel || null,
    contacted_at: inf.contact_date
      ? `${inf.contact_date}T12:00:00.000Z`
      : (inf.status && inf.status !== 'Novo' ? seedDate : null),
    last_contact_at: inf.contact_date
      ? `${inf.contact_date}T12:00:00.000Z`
      : (inf.status && inf.status !== 'Novo' ? seedDate : null),
    last_mined_at: null,
    source_query: null,
    created_at: seedDate,
  }
}

let inMemoryInfluencers = seed.influencers.map(mapSeedInfluencer)

let inMemoryPublicidades = [...seed.publicidades]
let inMemoryMetas = [...seed.metas]

let nextId = inMemoryInfluencers.length + 1
let nextPublicidadeId = inMemoryPublicidades.length + 1
let nextMetaId = inMemoryMetas.length + 1

const GAMES = ['Block Win', 'Bubble Win', 'Cust Win', 'Count Masters']

const SUPABASE_INFLUENCER_COLUMNS = [
  'username', 'full_name', 'profile_pic_url', 'bio', 'external_url',
  'followers_count', 'following_count', 'posts_count', 'avg_reels_views',
  'engagement_rate', 'whatsapp', 'email', 'has_competitor', 'competitor_name',
  'niche', 'score', 'classification', 'status', 'user_notes',
  'story_views_avg', 'story_clicks_avg', 'story_asking_price', 'estimated_revenue',
  'roi_verdict', 'is_agency', 'promotes_raffle', 'promotes_shopee',
  'created_at', 'paid_amount', 'revenue_generated', 'last_campaign_date',
  'outreach_channel', 'contacted_at', 'last_contact_at', 'last_mined_at',
  'source_query', 'is_ghost', 'campaign_game', 'ig_not_found',
]

const EXTRA_META_FIELDS = [
  'outreach_channel',
  'contacted_at',
  'last_contact_at',
  'last_mined_at',
  'source_query',
  'is_ghost',
  'campaign_game',
  'ig_not_found',
]

const missingInfluencerColumns = new Set()
const supabaseIdMap = new Map()
const supabaseTables = {
  influencers: !!supabase,
  publicidades: false,
  metas: false,
}
let hasHydrated = false
let initPromise = null
let warnedMissingTables = false

function isSupabaseWriteEnabled() {
  return Boolean(supabase && process.env.SKIP_SUPABASE_WRITE !== 'true')
}

function isMinedLead(inf) {
  return Boolean(inf && (inf.source_query || inf.last_mined_at))
}

function normalizeNullableDate(val) {
  if (val === undefined || val === null || val === '') return null
  return val
}

const RESERVED_IG_PATHS = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'popular', 'accounts', 'direct'])

/** Normaliza @username ou URL colada do Instagram em handle limpo sem @ ou barras. */
function normalizeHandleInput(raw) {
  let clean = String(raw || '').trim().toLowerCase()
  if (!clean) return ''
  clean = clean
    .replace(/^https?:\/\/(www\.|m\.)?instagram\.com\//i, '')
    .replace(/^(www\.|m\.)?instagram\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^@+/, '')
    .replace(/^\/+|\/+$/g, '')
  const firstSegment = (clean.split('/')[0] || '').replace(/^@+/, '').replace(/\s+/g, '')
  if (!firstSegment || RESERVED_IG_PATHS.has(firstSegment)) return ''
  return firstSegment
}

function unpackUserNotes(rawNotes) {
  if (!rawNotes || typeof rawNotes !== 'string') {
    return { cleanNotes: rawNotes || '', meta: {} }
  }
  const match = rawNotes.match(/\n?\[CRM_META:(\{[\s\S]*?\})\]\s*$/)
  if (!match) {
    return { cleanNotes: rawNotes, meta: {} }
  }
  let meta = {}
  try {
    meta = JSON.parse(match[1]) || {}
  } catch {
    meta = {}
  }
  const cleanNotes = rawNotes.slice(0, match.index).replace(/\s+$/, '')
  return { cleanNotes, meta }
}

function buildInfluencerSupabasePayload(record) {
  const payload = {}
  const fallbackMeta = {}

  for (const col of SUPABASE_INFLUENCER_COLUMNS) {
    if (missingInfluencerColumns.has(col)) {
      if (EXTRA_META_FIELDS.includes(col) && record[col] !== undefined && record[col] !== null && record[col] !== '' && record[col] !== false) {
        fallbackMeta[col] = record[col]
      }
      continue
    }

    if (record[col] === undefined) continue

    if (['followers_count', 'following_count', 'posts_count', 'avg_reels_views', 'story_views_avg', 'story_clicks_avg'].includes(col)) {
      payload[col] = parseInt(record[col], 10) || 0
    } else if (['engagement_rate', 'score', 'story_asking_price', 'estimated_revenue', 'paid_amount', 'revenue_generated'].includes(col)) {
      payload[col] = parseFloat(record[col]) || 0
    } else if (['has_competitor', 'is_agency', 'promotes_raffle', 'promotes_shopee', 'is_ghost', 'ig_not_found'].includes(col)) {
      payload[col] = Boolean(record[col])
    } else if (['created_at', 'last_campaign_date', 'contacted_at', 'last_contact_at', 'last_mined_at'].includes(col)) {
      payload[col] = normalizeNullableDate(record[col])
    } else {
      payload[col] = record[col]
    }
  }

  let baseNotes = typeof record.user_notes === 'string' ? record.user_notes : ''
  if (Object.keys(fallbackMeta).length > 0) {
    const encoded = `[CRM_META:${JSON.stringify(fallbackMeta)}]`
    baseNotes = baseNotes ? `${baseNotes}\n${encoded}` : encoded
  }
  if (!missingInfluencerColumns.has('user_notes')) {
    payload.user_notes = baseNotes
  }

  return payload
}

async function persistInfluencerToSupabase(record) {
  if (!isSupabaseWriteEnabled() || !record?.username) return null
  for (let attempt = 0; attempt < 10; attempt++) {
    const payload = buildInfluencerSupabasePayload(record)
    const { data, error } = await supabase
      .from('influencers')
      .upsert(payload, { onConflict: 'username' })
      .select('id, username')
      .single()

    if (!error) {
      if (data?.id) supabaseIdMap.set(record.username.toLowerCase(), data.id)
      return data
    }

    const msg = error.message || ''
    const missingMatch = msg.match(/Could not find the '([^']+)' column/) || msg.match(/column "?([a-z0-9_]+)"? of relation/i)
    if (missingMatch && missingMatch[1] && !missingInfluencerColumns.has(missingMatch[1])) {
      missingInfluencerColumns.add(missingMatch[1])
      continue
    }

    console.warn('[Supabase sync influencers]', msg)
    return null
  }
  return null
}

async function deleteInfluencerFromSupabase(username) {
  if (!isSupabaseWriteEnabled() || !username) return
  try {
    const { error } = await supabase.from('influencers').delete().eq('username', username.toLowerCase())
    if (error) console.warn('[Supabase delete influencers]', error.message)
    supabaseIdMap.delete(username.toLowerCase())
  } catch (err) {
    console.warn('[Supabase delete influencers]', err.message)
  }
}

async function persistPublicidadeToSupabase(ad) {
  if (!isSupabaseWriteEnabled() || !supabaseTables.publicidades || !ad) return null
  try {
    const payload = { ...ad }
    delete payload.id
    const { data, error } = await supabase.from('publicidades').upsert(payload).select('id').single()
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        supabaseTables.publicidades = false
        return null
      }
      console.warn('[Supabase sync publicidades]', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[Supabase sync publicidades]', err.message)
    return null
  }
}

async function persistMetaToSupabase(meta) {
  if (!isSupabaseWriteEnabled() || !supabaseTables.metas || !meta) return null
  try {
    const payload = { ...meta }
    delete payload.id
    const { data, error } = await supabase.from('metas').upsert(payload).select('id').single()
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        supabaseTables.metas = false
        return null
      }
      console.warn('[Supabase sync metas]', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[Supabase sync metas]', err.message)
    return null
  }
}

function hydrateInfluencerRow(row) {
  const username = (row.username || '').toLowerCase().replace(/^@+/, '').trim()
  const { cleanNotes, meta } = unpackUserNotes(row.user_notes)
  const merged = {
    ...row,
    ...meta,
    username,
    user_notes: cleanNotes,
    status: row.status || meta.status || 'Novo',
    email: row.email || meta.email || null,
    ig_not_found: Boolean(row.ig_not_found || meta.ig_not_found),
    score: row.score || 0,
    classification: row.classification || null,
    story_views_avg: row.story_views_avg || 0,
    story_clicks_avg: row.story_clicks_avg || 0,
    story_asking_price: row.story_asking_price || 0,
  }
  // Evita exibir seguidores/score fictícios (25k/35k) de sementes antigas sem enriquecimento real
  if (
    SEED_USERNAMES.has(username)
    && !merged.bio
    && !merged.profile_pic_url
    && !(merged.avg_reels_views > 0)
    && (merged.followers_count === 25000 || merged.followers_count === 35000)
  ) {
    merged.followers_count = 0
    merged.score = 0
    merged.classification = null
  }
  // Leads salvos no Supabase fora da planilha inicial do Pedro vieram de mineração/cadastro dinâmico
  if (!SEED_USERNAMES.has(username) && !merged.last_mined_at && !merged.source_query) {
    merged.last_mined_at = merged.created_at || new Date().toISOString()
    merged.source_query = merged.niche ? `Mineração (${merged.niche})` : 'Mineração (Supabase)'
  }
  return merged
}

async function hydrateFromSupabase() {
  if (!isSupabaseWriteEnabled()) {
    hasHydrated = true
    return
  }

  try {
    const { data: rows, error } = await supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2500)

    if (!error && Array.isArray(rows)) {
      supabaseTables.influencers = true
      const usedIds = new Set(inMemoryInfluencers.map(i => i.id))

      for (const rawRow of rows) {
        const hydrated = hydrateInfluencerRow(rawRow)
        if (!hydrated.username || hydrated.username === 'samuraii_da_resenha') continue
        if (rawRow.id) supabaseIdMap.set(hydrated.username, rawRow.id)

        const existingIdx = inMemoryInfluencers.findIndex(
          i => (i.username || '').toLowerCase() === hydrated.username
        )

        if (existingIdx !== -1) {
          const existing = inMemoryInfluencers[existingIdx]
          inMemoryInfluencers[existingIdx] = {
            ...existing,
            ...hydrated,
            id: existing.id,
            ig_not_found: hydrated.followers_count > 0 && hydrated.bio
              ? false
              : (hydrated.ig_not_found || existing.ig_not_found || false),
            last_mined_at: hydrated.last_mined_at || existing.last_mined_at || null,
            source_query: hydrated.source_query || existing.source_query || null,
          }
        } else {
          let assignedId = hydrated.id
          if (!assignedId || usedIds.has(assignedId)) {
            assignedId = nextId++
          } else if (assignedId >= nextId) {
            nextId = assignedId + 1
          }
          usedIds.add(assignedId)
          inMemoryInfluencers.unshift({
            ...hydrated,
            id: assignedId,
          })
        }
      }
    }

    const [pubRes, metaRes] = await Promise.all([
      supabase.from('publicidades').select('*').order('id', { ascending: false }).limit(1000),
      supabase.from('metas').select('*').order('id', { ascending: false }).limit(1000),
    ])

    if (!pubRes.error && Array.isArray(pubRes.data)) {
      supabaseTables.publicidades = true
      if (pubRes.data.length > 0) {
        inMemoryPublicidades = pubRes.data
        const maxPubId = pubRes.data.reduce((m, r) => Math.max(m, r.id || 0), 0)
        nextPublicidadeId = Math.max(nextPublicidadeId, maxPubId + 1)
      }
    } else if (pubRes.error) {
      supabaseTables.publicidades = false
    }

    if (!metaRes.error && Array.isArray(metaRes.data)) {
      supabaseTables.metas = true
      if (metaRes.data.length > 0) {
        inMemoryMetas = metaRes.data
        const maxMetaId = metaRes.data.reduce((m, r) => Math.max(m, r.id || 0), 0)
        nextMetaId = Math.max(nextMetaId, maxMetaId + 1)
      }
    } else if (metaRes.error && !warnedMissingTables) {
      supabaseTables.metas = false
      warnedMissingTables = true
      console.info('[Supabase] Tabelas extras (publicidades/metas) ainda não executadas no SQL Editor; operando em modo híbrido seguro.')
    }
  } catch (err) {
    console.warn('[Supabase hydrate warning]', err.message)
  } finally {
    hasHydrated = true
  }
}

async function ensureInitialized() {
  if (hasHydrated && process.env.SKIP_SUPABASE_WRITE !== 'true') return
  if (process.env.SKIP_SUPABASE_WRITE === 'true') {
    hasHydrated = true
    return
  }
  if (!initPromise) {
    initPromise = hydrateFromSupabase().finally(() => {
      initPromise = null
    })
  }
  await initPromise
}

const store = {
  isUsingSupabase() {
    return !!supabase
  },

  async ensureInitialized() {
    return ensureInitialized()
  },

  getSupabaseStatus() {
    return {
      configured: !!supabase,
      hydrated: hasHydrated,
      tables: { ...supabaseTables },
      missingColumns: Array.from(missingInfluencerColumns),
    }
  },

  async checkSupabaseHealth() {
    const lastPingAt = new Date().toISOString()
    if (!supabase) {
      return { configured: false, online: false, reason: 'not_configured', lastPingAt }
    }
    const startedAt = Date.now()
    try {
      // Executa leitura real (sem head-only) para registrar atividade na API/Postgres do Supabase e evitar hibernação
      const result = await Promise.race([
        supabase.from('influencers').select('id', { count: 'exact' }).limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout/paused')), 4000)),
      ])
      const latencyMs = Date.now() - startedAt
      if (result.error) {
        return { configured: true, online: false, reason: result.error.message, latencyMs, lastPingAt }
      }
      return {
        configured: true,
        online: true,
        count: result.count || 0,
        tables: { ...supabaseTables },
        latencyMs,
        lastPingAt,
      }
    } catch (err) {
      return {
        configured: true,
        online: false,
        reason: err.message,
        latencyMs: Date.now() - startedAt,
        lastPingAt,
      }
    }
  },

  listGames() {
    return GAMES
  },

  normalizeHandleInput,

  getAllUsernames() {
    return new Set(inMemoryInfluencers.map(i => (i.username || '').toLowerCase()).filter(Boolean))
  },

  // --- CAPTAÇÃO & DASHBOARD GERAL ---
  async getStats() {
    await ensureInitialized()
    const total = inMemoryInfluencers.length
    const qualified = inMemoryInfluencers.filter(i => i.classification === 'OURO' || i.classification === 'PRATA').length
    const whatsapps = inMemoryInfluencers.filter(i => i.whatsapp).length
    const closed = inMemoryInfluencers.filter(i => i.status === 'Fechou').length
    const negotiating = inMemoryInfluencers.filter(i => i.status === 'Em negociação' || i.status === 'Abordado').length
    const ghost = inMemoryInfluencers.filter(i => i.is_ghost || i.user_notes?.toLowerCase().includes('ghost')).length

    // Contagem por etapa de abordagem + 8 status do Pedro
    const statusCounts = {
      'Novo': 0,
      'Mensagem Enviada': 0,
      'Sem resposta': 0,
      'Em negociação': 0,
      'Fechou': 0,
      'Não interessado': 0,
      'Recusado - métricas ruins': 0,
      'Recusado - Remarketing': 0,
      'Outro momento': 0,
    }

    const channelCounts = { whatsapp: 0, instagram: 0, unspecified: 0 }
    let toContactCount = 0
    let sentWaitingCount = 0
    let repliedCount = 0
    let missingDataCount = 0
    let minedCount = 0
    let minedAwaitingCount = 0
    let minedMovedCount = 0

    for (const inf of inMemoryInfluencers) {
      const s = (inf.status || 'Novo').trim()
      if (statusCounts[s] !== undefined) {
        statusCounts[s]++
      }

      if (isMinedLead(inf)) {
        minedCount++
        if (s === 'Novo' || !s) minedAwaitingCount++
        else minedMovedCount++
      }

      if (s === 'Novo' || !s) {
        toContactCount++
      } else {
        if (s === 'Mensagem Enviada' || s === 'Sem resposta') {
          sentWaitingCount++
        } else {
          repliedCount++
        }
        if (inf.outreach_channel === 'whatsapp') channelCounts.whatsapp++
        else if (inf.outreach_channel === 'instagram') channelCounts.instagram++
        else channelCounts.unspecified++
      }

      if ((s === 'Novo' || s === 'Em negociação') && (!inf.whatsapp || !inf.story_views_avg)) {
        missingDataCount++
      }
    }

    const sentTotalCount = Math.max(0, total - toContactCount)
    const conversionRate = total > 0 ? Math.round((closed / total) * 1000) / 10 : 0
    const responseRate = sentTotalCount > 0 ? Math.round((repliedCount / sentTotalCount) * 1000) / 10 : 0
    const pubStats = await this.getPublicidadesStats()

    return {
      total,
      qualified,
      whatsapps,
      closed,
      negotiating,
      ghost,
      conversionRate,
      toContactCount,
      sentWaitingCount,
      sentTotalCount,
      repliedCount,
      responseRate,
      missingDataCount,
      minedCount,
      minedAwaitingCount,
      minedMovedCount,
      channelCounts,
      statusCounts,
      publicidadesSummary: {
        totalAds: pubStats.totalAds,
        totalInvested: pubStats.totalInvested,
        totalReturn: pubStats.totalReturn,
        netProfit: pubStats.netProfit,
        overallRoi: pubStats.overallRoi,
      },
    }
  },

  async listInfluencers({ search, status, stage, channel, classification, minFollowers, hideAgencies, onlyMined, sortBy = 'recent', page = 1, limit = 20 }) {
    await ensureInitialized()
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 250)
    const offset = (pageNum - 1) * limitNum

    let filtered = [...inMemoryInfluencers]

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(i =>
        (i.username && i.username.toLowerCase().includes(s)) ||
        (i.full_name && i.full_name.toLowerCase().includes(s)) ||
        (i.campaign_game && i.campaign_game.toLowerCase().includes(s)) ||
        (i.niche && i.niche.toLowerCase().includes(s)) ||
        (i.bio && i.bio.toLowerCase().includes(s)) ||
        (i.user_notes && i.user_notes.toLowerCase().includes(s)) ||
        (i.source_query && i.source_query.toLowerCase().includes(s))
      )
    }

    if (stage === 'to_contact') {
      filtered = filtered.filter(i => (i.status || 'Novo') === 'Novo')
    } else if (stage === 'sent') {
      filtered = filtered.filter(i => (i.status || 'Novo') !== 'Novo')
    } else if (stage === 'mined') {
      filtered = filtered.filter(i => isMinedLead(i))
    }

    if (channel) {
      filtered = filtered.filter(i => i.outreach_channel === channel)
    }

    if (status) {
      if (status === 'Remarketing') {
        filtered = filtered.filter(i => i.status === 'Recusado - Remarketing' || i.status === 'Outro momento')
      } else if (status === 'Recusados') {
        filtered = filtered.filter(i =>
          ['Recusado - Remarketing', 'Outro momento', 'Não interessado', 'Recusado - métricas ruins'].includes(i.status)
        )
      } else if (status === 'Aguardando') {
        filtered = filtered.filter(i => i.status === 'Mensagem Enviada' || i.status === 'Sem resposta')
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

    if (onlyMined === true || onlyMined === 'true') {
      filtered = filtered.filter(i => !!i.source_query || i.status === 'Novo')
    }

    // Ordenação flexível (Mais recentes por padrão para leads minerados aparecerem no topo)
    if (sortBy === 'score') {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0))
    } else if (sortBy === 'followers') {
      filtered.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0))
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => (b.avg_reels_views || 0) - (a.avg_reels_views || 0))
    } else {
      filtered.sort((a, b) => {
        const timeA = Math.max(new Date(a.last_mined_at || 0).getTime(), new Date(a.created_at || 0).getTime())
        const timeB = Math.max(new Date(b.last_mined_at || 0).getTime(), new Date(b.created_at || 0).getTime())
        if (timeB !== timeA) return timeB - timeA
        return (b.score || 0) - (a.score || 0)
      })
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limitNum)

    return {
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    }
  },

  async getInfluencer(id) {
    await ensureInitialized()
    const cleanTarget = normalizeHandleInput(id) || String(id || '').toLowerCase()
    return inMemoryInfluencers.find(
      i => String(i.id) === String(id) || i.username === cleanTarget || i.username === String(id).toLowerCase()
    ) || null
  },

  async createInfluencer(body) {
    await ensureInitialized()
    const username = normalizeHandleInput(body.username)
    if (!username) return null
    const existingIndex = inMemoryInfluencers.findIndex(i => i.username === username)

    if (existingIndex !== -1) {
      // Abre o existente
      return inMemoryInfluencers[existingIndex]
    }

    const followers = parseInt(body.followers_count, 10) || 0
    const reelsViews = parseInt(body.avg_reels_views, 10) || 0
    const hasMetrics = followers > 0 || reelsViews > 0
    const calculated = hasMetrics ? calculateScore(body) : { score: 0, classification: null }
    const now = new Date().toISOString()
    const newRecord = {
      id: nextId++,
      ...body,
      username,
      full_name: body.full_name || username,
      followers_count: followers,
      avg_reels_views: reelsViews,
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      ig_not_found: Boolean(body.ig_not_found),
      score: body.score ?? calculated.score ?? 0,
      classification: body.classification !== undefined ? body.classification : (calculated.classification || null),
      status: body.status || 'Novo',
      user_notes: body.user_notes || '',
      is_ghost: !!body.is_ghost,
      campaign_game: normalizeGame(body.campaign_game),
      created_at: body.created_at || now,
    }

    inMemoryInfluencers.unshift(newRecord)
    await persistInfluencerToSupabase(newRecord)
    return newRecord
  },

  async updateInfluencer(id, body) {
    await ensureInitialized()
    const index = inMemoryInfluencers.findIndex(i => String(i.id) === String(id) || i.username === String(id).toLowerCase())
    if (index === -1) return null

    const current = inMemoryInfluencers[index]
    const prevStatus = current.status || 'Novo'
    const nextStatus = body.status !== undefined ? body.status : prevStatus
    const now = new Date().toISOString()

    let contactedAt = body.contacted_at !== undefined ? body.contacted_at : current.contacted_at || null
    let lastContactAt = body.last_contact_at !== undefined ? body.last_contact_at : current.last_contact_at || null

    if (prevStatus === 'Novo' && nextStatus !== 'Novo') {
      if (!contactedAt) contactedAt = now
      lastContactAt = now
    } else if (body.outreach_channel || (body.status && body.status !== prevStatus && nextStatus !== 'Novo')) {
      lastContactAt = now
      if (!contactedAt && nextStatus !== 'Novo') contactedAt = now
    }

    const sanitized = { ...body }
    if (sanitized.username !== undefined) {
      const cleanedHandle = normalizeHandleInput(sanitized.username)
      if (cleanedHandle) sanitized.username = cleanedHandle
      else delete sanitized.username
    }
    if (sanitized.email !== undefined) {
      sanitized.email = sanitized.email ? String(sanitized.email).trim().toLowerCase() : null
    }
    if (sanitized.ig_not_found !== undefined) {
      sanitized.ig_not_found = Boolean(sanitized.ig_not_found)
    }
    if (sanitized.followers_count !== undefined) {
      sanitized.followers_count = parseInt(sanitized.followers_count, 10) || 0
    }
    if (sanitized.avg_reels_views !== undefined) {
      sanitized.avg_reels_views = parseInt(sanitized.avg_reels_views, 10) || 0
    }
    if (sanitized.story_views_avg !== undefined) {
      sanitized.story_views_avg = parseInt(sanitized.story_views_avg, 10) || 0
    }
    if (sanitized.story_clicks_avg !== undefined) {
      sanitized.story_clicks_avg = parseInt(sanitized.story_clicks_avg, 10) || 0
    }
    if (sanitized.story_asking_price !== undefined) {
      sanitized.story_asking_price = parseFloat(sanitized.story_asking_price) || 0
    }
    if (sanitized.campaign_game !== undefined) {
      sanitized.campaign_game = sanitized.campaign_game ? normalizeGame(sanitized.campaign_game) : null
    }

    inMemoryInfluencers[index] = {
      ...current,
      ...sanitized,
      contacted_at: contactedAt,
      last_contact_at: lastContactAt,
    }
    await persistInfluencerToSupabase(inMemoryInfluencers[index])
    return inMemoryInfluencers[index]
  },

  async deleteInfluencer(id) {
    await ensureInitialized()
    const target = inMemoryInfluencers.find(i => String(i.id) === String(id) || i.username === String(id).toLowerCase())
    if (!target) return false
    inMemoryInfluencers = inMemoryInfluencers.filter(i => i !== target)
    await deleteInfluencerFromSupabase(target.username)
    return true
  },

  async upsertInfluencer(item) {
    await ensureInitialized()
    const username = normalizeHandleInput(item.username)
    if (!username) return false

    const now = new Date().toISOString()
    const existingIndex = inMemoryInfluencers.findIndex(i => i.username.toLowerCase() === username.toLowerCase())

    if (existingIndex !== -1) {
      const existing = inMemoryInfluencers[existingIndex]
      const updatedRecord = {
        ...existing,
        ...item,
        username,
        whatsapp: item.whatsapp || existing.whatsapp || null,
        email: item.email || existing.email || null,
        ig_not_found: item.ig_not_found !== undefined ? Boolean(item.ig_not_found) : Boolean(existing.ig_not_found),
        // Preserva histórico comercial do Pedro caso o lead já exista no CRM
        status: existing.status && existing.status !== 'Novo' ? existing.status : (item.status || existing.status || 'Novo'),
        user_notes: existing.user_notes || item.user_notes || '',
        campaign_game: existing.campaign_game || item.campaign_game || null,
        outreach_channel: existing.outreach_channel || item.outreach_channel || null,
        contacted_at: existing.contacted_at || item.contacted_at || null,
        last_contact_at: existing.last_contact_at || item.last_contact_at || null,
        paid_amount: existing.paid_amount || item.paid_amount || 0,
        revenue_generated: existing.revenue_generated || item.revenue_generated || 0,
        last_mined_at: item.last_mined_at || (item.source_query ? now : existing.last_mined_at || null),
        created_at: existing.created_at || now,
      }
      inMemoryInfluencers[existingIndex] = updatedRecord
      await persistInfluencerToSupabase(updatedRecord)
      return { action: 'updated', record: updatedRecord }
    } else {
      const newRecord = {
        id: nextId++,
        status: item.status || 'Novo',
        user_notes: item.user_notes || '',
        created_at: now,
        last_mined_at: item.last_mined_at || now,
        ...item,
        username,
      }
      inMemoryInfluencers.unshift(newRecord)
      await persistInfluencerToSupabase(newRecord)
      return { action: 'inserted', record: newRecord }
    }
  },

  async batchUpsertInfluencers(items = []) {
    const records = []
    let inserted = 0
    let updated = 0
    for (const item of items) {
      const res = await this.upsertInfluencer(item)
      if (res && res.record) {
        records.push(res.record)
        if (res.action === 'inserted') inserted++
        else updated++
      }
    }
    return { inserted, updated, records }
  },

  // --- MÓDULO: PUBLICIDADES (CONTROLE FINANCEIRO) ---
  async listPublicidades({ influencer, game, closureType, deliveryStatus, paymentStatus, page = 1, limit = 50 } = {}) {
    await ensureInitialized()
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
    await ensureInitialized()
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
    await ensureInitialized()
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
    const savedPub = await persistPublicidadeToSupabase(newAd)
    if (savedPub?.id) newAd.id = savedPub.id

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
    await ensureInitialized()
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
    if (isSupabaseWriteEnabled() && supabaseTables.publicidades) {
      const payload = { ...inMemoryPublicidades[index] }
      delete payload.id
      await supabase.from('publicidades').update(payload).eq('id', current.id).then(() => {}, () => {})
    }

    return inMemoryPublicidades[index]
  },

  async deletePublicidade(id) {
    await ensureInitialized()
    const len = inMemoryPublicidades.length
    inMemoryPublicidades = inMemoryPublicidades.filter(p => String(p.id) !== String(id))
    if (inMemoryPublicidades.length < len && isSupabaseWriteEnabled() && supabaseTables.publicidades) {
      await supabase.from('publicidades').delete().eq('id', id).then(() => {}, () => {})
    }
    return inMemoryPublicidades.length < len
  },

  // --- MÓDULO: METAS DE DEPOSITANTES ---
  async listMetas() {
    await ensureInitialized()
    return inMemoryMetas
  },

  async getMetasStats() {
    await ensureInitialized()
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
    await ensureInitialized()
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
    const savedMeta = await persistMetaToSupabase(newMeta)
    if (savedMeta?.id) newMeta.id = savedMeta.id
    return newMeta
  },

  async updateMeta(id, body) {
    await ensureInitialized()
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
    if (isSupabaseWriteEnabled() && supabaseTables.metas) {
      const payload = { ...inMemoryMetas[index] }
      delete payload.id
      await supabase.from('metas').update(payload).eq('id', current.id).then(() => {}, () => {})
    }

    return inMemoryMetas[index]
  },

  async incrementMeta(id, incrementAmount = 1) {
    await ensureInitialized()
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
    if (isSupabaseWriteEnabled() && supabaseTables.metas) {
      const payload = { ...inMemoryMetas[index] }
      delete payload.id
      await supabase.from('metas').update(payload).eq('id', current.id).then(() => {}, () => {})
    }

    return inMemoryMetas[index]
  },

  // --- PERFIL UNIFICADO DO INFLUENCIADOR ---
  async getInfluencerFullProfile(usernameOrId) {
    await ensureInitialized()
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
    inMemoryInfluencers = fresh.influencers.map(mapSeedInfluencer)
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
