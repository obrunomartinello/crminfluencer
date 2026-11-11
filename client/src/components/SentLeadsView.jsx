import React, { useState, useEffect, useCallback } from 'react'
import {
  Send,
  Clock,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  AtSign,
  Edit3,
  Search,
  ExternalLink,
  Archive,
} from 'lucide-react'
import { api } from '../lib/api'
import { PEDRO_STATUSES } from '../constants/nichePresets'

function formatSentDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  if (diffDays <= 0) return `${dateStr} (hoje)`
  if (diffDays === 1) return `${dateStr} (ontem)`
  return `${dateStr} (${diffDays}d)`
}

function formatMoney(val) {
  if (!val) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function SentLeadsView({
  stats = {},
  initialStatusFilter = '',
  onSelectInfluencer,
  onStatusChange,
  onRefreshParentStats,
}) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || '')
  const [channelFilter, setChannelFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setStatusFilter(initialStatusFilter || '')
  }, [initialStatusFilter])

  const loadSentLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getInfluencers({
        stage: 'sent',
        status: statusFilter,
        channel: channelFilter,
        search,
        sortBy: 'recent',
        page: 1,
        limit: 200,
      })
      setLeads(res.data || [])
    } catch (err) {
      console.warn('Erro ao carregar leads já mandados:', err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, channelFilter, search])

  useEffect(() => {
    loadSentLeads()
  }, [loadSentLeads])

  const {
    sentTotalCount = 0,
    sentWaitingCount = 0,
    repliedCount = 0,
    responseRate = 0,
    channelCounts = {},
    statusCounts = {},
  } = stats

  const remarketingCount =
    (statusCounts['Recusado - Remarketing'] || 0) +
    (statusCounts['Outro momento'] || 0) +
    (statusCounts['Não interessado'] || 0) +
    (statusCounts['Recusado - métricas ruins'] || 0)

  const stageChips = [
    { id: '', label: `Todos Enviados (${sentTotalCount})` },
    { id: 'Aguardando', label: `Aguardando Resposta (${sentWaitingCount})` },
    { id: 'Em negociação', label: `Em Negociação (${statusCounts['Em negociação'] || 0})` },
    { id: 'Fechou', label: `Fechou (${statusCounts['Fechou'] || 0})` },
    { id: 'Recusados', label: `Remarketing / Recusados (${remarketingCount})` },
  ]

  const handleInlineStatus = async (inf, nextStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === inf.id ? { ...l, status: nextStatus } : l)))
    await onStatusChange(inf.id, nextStatus)
    loadSentLeads()
  }

  const handleRegisterFollowup = async (inf) => {
    try {
      await api.updateInfluencer(inf.id, {
        last_contact_at: new Date().toISOString(),
        outreach_channel: inf.outreach_channel || (inf.whatsapp ? 'whatsapp' : 'instagram'),
      })
      if (onRefreshParentStats) onRefreshParentStats()
      loadSentLeads()
    } catch (err) {
      console.warn('Erro ao registrar follow-up:', err.message)
    }
  }

  return (
    <div className="space-y-5">
      {/* 4 Mini-Cards de Resumo dos Já Mandados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-4 border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Total Já Mandados
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send size={15} />
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {sentTotalCount}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {channelCounts.whatsapp || 0} Whats • {channelCounts.instagram || 0} Direct IG
          </div>
        </div>

        <div
          className="rounded-2xl p-4 border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Aguardando Resposta
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={15} />
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {sentWaitingCount}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Msg Enviada + Sem resposta
          </div>
        </div>

        <div
          className="rounded-2xl p-4 border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Responderam / Avançaram
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {repliedCount}{' '}
            <span className="text-sm font-semibold">({responseRate}%)</span>
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Taxa de resposta sobre os mandados
          </div>
        </div>

        <div
          className="rounded-2xl p-4 border flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Remarketing & Recusas
            </span>
            <span className="w-8 h-8 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center">
              <Archive size={15} />
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {remarketingCount}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Disponíveis p/ retomada futura
          </div>
        </div>
      </div>

      {/* Filtros de Etapa, Canal & Busca */}
      <div
        className="rounded-2xl p-4 border space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {stageChips.map((chip) => {
            const active = statusFilter === chip.id
            return (
              <button
                key={chip.id || 'all'}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-transparent shadow-sm'
                    : 'hover:bg-zinc-500/10'
                }`}
                style={{
                  backgroundColor: active ? undefined : 'var(--bg-card-secondary)',
                  borderColor: active ? undefined : 'var(--border-color)',
                  color: active ? undefined : 'var(--text-primary)',
                }}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nos já mandados por @, nome ou observação..."
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="border rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Canal: Todos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Direct IG</option>
            </select>

            <button
              type="button"
              onClick={loadSentLeads}
              className="p-2 rounded-xl border hover:bg-zinc-500/10"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
              }}
              title="Atualizar lista"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Acompanhamento dos Já Mandados */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {loading && leads.length === 0 ? (
          <div className="p-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Carregando histórico de mensagens enviadas...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Nenhum lead encontrado neste filtro de enviados
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Assim que marcar um criador como "Já Mandei Msg" no Kanban, ele aparece aqui para acompanhamento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="border-b text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'var(--bg-card-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="py-3 px-4">Criador</th>
                  <th className="py-3 px-3">Canal & Envio</th>
                  <th className="py-3 px-3">Etapa Atual</th>
                  <th className="py-3 px-3">Stories / Preço</th>
                  <th className="py-3 px-3">Observações</th>
                  <th className="py-3 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {leads.map((inf) => {
                  const cleanWa = (inf.whatsapp || '').replace(/\D/g, '')
                  const intlWa = cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`
                  return (
                    <tr
                      key={inf.id}
                      onClick={() => onSelectInfluencer(inf)}
                      className="cursor-pointer transition-colors hover:bg-zinc-500/5"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {inf.full_name || inf.username}
                        </div>
                        <a
                          href={`https://instagram.com/${inf.username}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-blue-500 hover:underline inline-flex items-center gap-0.5"
                        >
                          @{inf.username} <ExternalLink size={9} />
                        </a>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {inf.outreach_channel === 'whatsapp' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <MessageCircle size={10} /> WhatsApp
                            </span>
                          ) : inf.outreach_channel === 'instagram' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400">
                              <AtSign size={10} /> Direct IG
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-zinc-500">
                              Histórico planilha
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {formatSentDate(inf.last_contact_at || inf.contacted_at)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={inf.status || 'Mensagem Enviada'}
                          onChange={(e) => handleInlineStatus(inf, e.target.value)}
                          className="border rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {PEDRO_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {inf.story_views_avg > 0 ? `${inf.story_views_avg.toLocaleString('pt-BR')} views` : '—'}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {inf.story_asking_price > 0 ? `Pedido: ${formatMoney(inf.story_asking_price)}` : 'Sem preço'}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }} title={inf.user_notes || ''}>
                          {inf.user_notes || '—'}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {cleanWa && (
                            <a
                              href={`https://wa.me/${intlWa}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1"
                              title="Cobrar retorno no WhatsApp"
                            >
                              <MessageCircle size={11} />
                              <span>Cobrar</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRegisterFollowup(inf)}
                            className="px-2 py-1 rounded-lg border text-[10px] font-semibold hover:border-blue-500/50"
                            style={{
                              backgroundColor: 'var(--bg-card-secondary)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                            title="Registrar nova tentativa hoje"
                          >
                            +Follow-up
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectInfluencer(inf)}
                            className="px-2 py-1 rounded-lg border text-[10px] font-semibold inline-flex items-center gap-1 hover:border-blue-500/50"
                            style={{
                              backgroundColor: 'var(--bg-card-secondary)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <Edit3 size={11} />
                            <span>Ficha</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
