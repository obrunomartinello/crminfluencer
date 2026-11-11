/**
 * @pilar PILAR 3 — Funil SDR: Minerados, Kanban & Ficha
 * Aba exclusiva de leads minerados/captados, agrupados e numerados por data
 * (Hoje, Ontem, Esta Semana, Semana Passada, Anteriores) mostrando para qual
 * etapa do CRM Kanban cada lead se movimentou.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../lib/api'
import { cleanInstagramHandle, getInstagramProfileUrl, formatFollowersLabel } from '../lib/instagram'
import {
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Send,
  Edit3,
  RefreshCw,
  Columns3,
  Calendar,
} from 'lucide-react'

function formatCompact(num) {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(num)
}

function formatDateTimePt(iso) {
  if (!iso) return 'Data n/d'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Data n/d'
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} às ${time}`
}

function getDateBucketKey(iso) {
  if (!iso) return 'older'
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return 'older'

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  const diffDays = Math.round((todayStart - targetStart) / 86400000)

  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 6) return 'this_week'
  if (diffDays <= 13) return 'last_week'
  return 'older'
}

const DATE_BUCKETS = [
  { key: 'today', label: '🔥 Hoje', desc: 'Minerados no dia de hoje' },
  { key: 'yesterday', label: '🕒 Ontem', desc: 'Varreduras de ontem' },
  { key: 'this_week', label: '📆 Esta Semana', desc: 'Últimos 2 a 6 dias' },
  { key: 'last_week', label: '🗓️ Semana Passada', desc: 'Entre 7 e 13 dias atrás' },
  { key: 'older', label: '📁 Anteriores', desc: 'Mais de 2 semanas' },
]

function getJourneyInfo(inf) {
  const st = (inf.status || 'Novo').trim()
  const channelLabel =
    inf.outreach_channel === 'whatsapp'
      ? 'WhatsApp'
      : inf.outreach_channel === 'instagram'
        ? 'Direct IG'
        : ''
  const movedAt = inf.contacted_at ? formatDateTimePt(inf.contacted_at) : ''

  if (st === 'Novo' || !st) {
    return {
      text: '📍 Ainda em: 🎯 Para Abordar',
      sub: 'Aguardando 1ª mensagem',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    }
  }
  if (st === 'Mensagem Enviada' || st === 'Sem resposta') {
    return {
      text: `➡️ Foi p/: 🚀 ${st}`,
      sub: [channelLabel, movedAt].filter(Boolean).join(' • ') || 'Movido no funil',
      badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    }
  }
  if (st === 'Em negociação') {
    return {
      text: '➡️ Foi p/: 🃏 Em Negociação',
      sub: [channelLabel, movedAt].filter(Boolean).join(' • ') || 'Respondeu! Pedir Stories e valor',
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    }
  }
  if (st === 'Fechou') {
    return {
      text: '🏆 Foi p/: Fechou (Jackpot!)',
      sub: inf.campaign_game ? `Campanha ${inf.campaign_game}` : 'Pronto p/ lançar Publicidade',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    }
  }
  return {
    text: `♻️ Foi p/: ${st}`,
    sub: [channelLabel, movedAt].filter(Boolean).join(' • ') || 'Movido do funil principal',
    badgeClass: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
  }
}

export default function MinedLeadsView({
  onSelectInfluencer,
  onMarkSent,
  onMineClick,
  onOpenInKanban,
  refreshKey = 0,
}) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [journeyFilter, setJourneyFilter] = useState('all') // 'all' | 'waiting' | 'moved' | 'closed'
  const [sendingId, setSendingId] = useState(null)

  const loadMinedLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getInfluencers({
        stage: 'mined',
        sortBy: 'recent',
        page: 1,
        limit: 250,
      })
      setLeads(res?.data || [])
    } catch (err) {
      console.error('Erro ao carregar aba Minerados:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMinedLeads()
  }, [loadMinedLeads, refreshKey])

  const summary = useMemo(() => {
    const waiting = leads.filter((i) => !i.status || i.status === 'Novo').length
    const closed = leads.filter((i) => i.status === 'Fechou').length
    const moved = leads.length - waiting
    return { total: leads.length, waiting, moved, closed }
  }, [leads])

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((inf) => {
      const st = (inf.status || 'Novo').trim()
      if (journeyFilter === 'waiting' && st !== 'Novo') return false
      if (journeyFilter === 'moved' && st === 'Novo') return false
      if (journeyFilter === 'closed' && st !== 'Fechou') return false

      if (!q) return true
      return (
        (inf.username || '').toLowerCase().includes(q) ||
        (inf.full_name || '').toLowerCase().includes(q) ||
        (inf.source_query || '').toLowerCase().includes(q) ||
        (inf.niche || '').toLowerCase().includes(q)
      )
    })
  }, [leads, search, journeyFilter])

  const groupedSections = useMemo(() => {
    const map = new Map()
    for (const b of DATE_BUCKETS) map.set(b.key, [])

    for (const inf of filteredLeads) {
      const dateRef = inf.last_mined_at || inf.created_at
      const key = getDateBucketKey(dateRef)
      map.get(key).push(inf)
    }

    return DATE_BUCKETS
      .map((bucket) => ({
        ...bucket,
        items: map.get(bucket.key) || [],
      }))
      .filter((section) => section.items.length > 0)
  }, [filteredLeads])

  const handleQuickSend = async (inf, channel = 'whatsapp') => {
    setSendingId(inf.id)
    try {
      await onMarkSent(inf, channel)
      await loadMinedLeads()
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Faixa explicativa + Botão de Nova Mineração */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">💎</span>
            <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Histórico de Varreduras & Rastro no Funil
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Todos os criadores encontrados na busca aparecem numerados por data com o status atual: se ainda estão em <strong>🎯 Para Abordar</strong> ou para qual coluna do <strong>CRM Kanban</strong> já foram movidos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadMinedLeads}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:border-emerald-500/40"
            style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            onClick={onMineClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Sparkles size={13} />
            <span>Minerar Novos Leads</span>
          </button>
        </div>
      </div>

      {/* Cards de resumo numérico */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>💎 Total Minerados</div>
          <div className="text-2xl font-extrabold mt-0.5" style={{ color: 'var(--text-primary)' }}>{summary.total}</div>
        </div>
        <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">🎯 Ainda na Fila (Para Abordar)</div>
          <div className="text-2xl font-extrabold mt-0.5 text-amber-600 dark:text-amber-400">{summary.waiting}</div>
        </div>
        <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">🚀 Já Movidos no Funil</div>
          <div className="text-2xl font-extrabold mt-0.5 text-sky-600 dark:text-sky-400">{summary.moved}</div>
        </div>
        <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">🏆 Fechou (Jackpot)</div>
          <div className="text-2xl font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400">{summary.closed}</div>
        </div>
      </div>

      {/* Filtros + Busca */}
      <div
        className="p-3 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `Todos (${summary.total})` },
            { id: 'waiting', label: `🎯 Ainda Para Abordar (${summary.waiting})` },
            { id: 'moved', label: `➡️ Já Movidos p/ Funil (${summary.moved})` },
            { id: 'closed', label: `🏆 Fechados (${summary.closed})` },
          ].map((tab) => {
            const active = journeyFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setJourneyFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-emerald-600 text-white border-transparent shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: active ? undefined : 'var(--bg-card-secondary)',
                  borderColor: active ? undefined : 'var(--border-color)',
                  color: active ? undefined : 'var(--text-primary)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar @, nome ou termo da busca..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Lista agrupada por data e numerada */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl border animate-pulse" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
          ))}
        </div>
      ) : groupedSections.length === 0 ? (
        <div
          className="p-10 rounded-2xl border text-center space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-3xl">💎</div>
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Nenhum lead minerado encontrado neste filtro
          </div>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            Rode uma nova busca na Apify para descobrir criadores novos — eles aparecerão aqui numerados por data junto com o destino deles no CRM Kanban.
          </p>
          <button
            type="button"
            onClick={onMineClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            <Sparkles size={14} />
            <span>Fazer Varredura Agora</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedSections.map((section) => (
            <div key={section.key} className="space-y-2.5">
              {/* Cabeçalho do grupo de data */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-500" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    {section.label}
                  </h4>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    — {section.desc}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  {section.items.length} {section.items.length === 1 ? 'lead' : 'leads'}
                </span>
              </div>

              {/* Cards numerados do grupo */}
              <div className="space-y-2">
                {section.items.map((inf, idx) => {
                  const journey = getJourneyInfo(inf)
                  const dateRef = inf.last_mined_at || inf.created_at
                  const isWaiting = !inf.status || inf.status === 'Novo'

                  return (
                    <div
                      key={inf.id}
                      className="p-3.5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all hover:border-emerald-500/40"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      {/* Esquerda: Número sequencial + Perfil + Termo */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border"
                          style={{
                            backgroundColor: 'var(--bg-card-secondary)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                          title={`Lead #${idx + 1} em ${section.label}`}
                        >
                          #{idx + 1}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                              {inf.full_name && inf.full_name !== inf.username ? inf.full_name : `@${inf.username}`}
                            </span>
                            {getInstagramProfileUrl(inf.username) ? (
                              <a
                                href={getInstagramProfileUrl(inf.username)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                @{cleanInstagramHandle(inf.username)}
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                @{inf.username}
                              </span>
                            )}
                            {inf.ig_not_found && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                                ⚠️ @ não encontrado
                              </span>
                            )}
                            {inf.classification && (inf.score > 0) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                {inf.classification} ({inf.score})
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            <span>👥 {formatFollowersLabel(inf.followers_count, false)}</span>
                            <span>•</span>
                            <span>
                              👁️ {inf.avg_reels_views > 0 ? `${formatCompact(inf.avg_reels_views)} views Reels` : 'views n/d'}
                            </span>
                            <span>•</span>
                            <span>🕒 Minerado em {formatDateTimePt(dateRef)}</span>
                            {inf.source_query && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                  🔍 {inf.source_query}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Centro: Rastro de onde está / para onde foi */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
                        <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold ${journey.badgeClass}`}>
                          <div className="flex items-center gap-1.5">
                            <span>{journey.text}</span>
                          </div>
                          {journey.sub && (
                            <div className="text-[10px] font-normal opacity-85 mt-0.5">
                              {journey.sub}
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1.5">
                          {isWaiting && (
                            <button
                              type="button"
                              disabled={sendingId === inf.id}
                              onClick={() => handleQuickSend(inf, inf.whatsapp ? 'whatsapp' : 'instagram')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all disabled:opacity-50"
                              title="Marcar como Mensagem Enviada e mover no Kanban"
                            >
                              {inf.whatsapp ? <MessageCircle size={12} /> : <Send size={12} />}
                              <span>{sendingId === inf.id ? 'Movendo...' : 'Já Mandei Msg'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenInKanban(inf)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all hover:border-emerald-500/40"
                            style={{
                              backgroundColor: 'var(--bg-card-secondary)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                            title="Localizar este lead no CRM Kanban"
                          >
                            <Columns3 size={12} />
                            <span>Kanban</span>
                            <ArrowRight size={10} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectInfluencer(inf)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all hover:border-blue-500/40"
                            style={{
                              backgroundColor: 'var(--bg-card-secondary)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                            title="Abrir Ficha completa"
                          >
                            <Edit3 size={12} />
                            <span>Ficha</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
