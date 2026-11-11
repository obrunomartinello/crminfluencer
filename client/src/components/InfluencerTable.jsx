import React from 'react'
import { PEDRO_STATUSES } from '../constants/nichePresets'
import { cleanInstagramHandle, getInstagramProfileUrl, formatFollowersLabel } from '../lib/instagram'
import {
  ExternalLink,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Inbox,
  Building2,
  Ticket,
  ShoppingBag,
  UserPlus,
  Edit3,
  AlertTriangle,
} from 'lucide-react'

export default function InfluencerTable({
  influencers = [],
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange,
  onSelectInfluencer,
  onStatusChange,
  loading = false,
  onMineClick,
  onAddLeadClick,
}) {
  const formatNum = (num) => new Intl.NumberFormat('pt-BR').format(num || 0)
  const formatMoney = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const getEngagementBadge = (rate) => {
    const r = parseFloat(rate) || 0
    if (r >= 15) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          {r.toFixed(1)}%
        </span>
      )
    }
    if (r >= 5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
          {r.toFixed(1)}%
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25">
        {r.toFixed(1)}%
      </span>
    )
  }

  const getClassificationBadge = (cls, score) => {
    if (!cls || !(Number(score) > 0)) {
      return (
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Não analisado
        </span>
      )
    }
    switch (cls) {
      case 'OURO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-sm">
            💎 OURO <span className="opacity-75">({score})</span>
          </span>
        )
      case 'PRATA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border border-zinc-400/30">
            🥈 PRATA <span className="opacity-75">({score})</span>
          </span>
        )
      case 'BRONZE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
            🥉 BRONZE <span className="opacity-75">({score})</span>
          </span>
        )
      case 'LIXO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
            🗑️ LIXO <span className="opacity-75">({score})</span>
          </span>
        )
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Fechou':
      case 'Fechado':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
      case 'Em negociação':
      case 'Negociando':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
      case 'Recusado - Remarketing':
      case 'Outro momento':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
      case 'Sem resposta':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
      case 'Não interessado':
      case 'Recusado - métricas ruins':
      case 'Desqualificado':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'Mensagem Enviada':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
      case 'Novo':
      default:
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
    }
  }

  if (loading && influencers.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Carregando base de criadores...
        </p>
      </div>
    )
  }

  if (!loading && influencers.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl border flex items-center justify-center"
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <Inbox size={26} />
        </div>
        <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Nenhum criador cadastrado
        </h4>
        <p className="text-xs max-w-sm mx-auto mb-5" style={{ color: 'var(--text-muted)' }}>
          Cadastre os parceiros que você já tem ou inicie uma mineração automática de novos criadores.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onAddLeadClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            <UserPlus size={14} />
            <span>+ Cadastrar Manual</span>
          </button>
          <button
            onClick={onMineClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Sparkles size={14} />
            <span>Minerar Criadores</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="border rounded-2xl overflow-hidden shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              className="border-b font-semibold"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              <th className="py-3 px-4">Criador</th>
              <th className="py-3 px-3">Contato (Whats / E-mail)</th>
              <th className="py-3 px-3">Audiência (IG Real)</th>
              <th className="py-3 px-3">Jogo & Stories Reais</th>
              <th className="py-3 px-3">Bio / Alerta</th>
              <th className="py-3 px-3">Score IG</th>
              <th className="py-3 px-3">Pipeline</th>
              <th className="py-3 px-3">Observações</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {influencers.map((inf) => {
              const initials = (inf.full_name || inf.username || '?')
                .slice(0, 2)
                .toUpperCase()
              const igUrl = getInstagramProfileUrl(inf.username)
              const cleanHandle = cleanInstagramHandle(inf.username) || inf.username
              const hasScrapedProfile = (Number(inf.followers_count) || 0) > 0 || Boolean(inf.bio)
              const hasContact = Boolean(inf.whatsapp || inf.email)

              return (
                <tr
                  key={inf.id}
                  onClick={() => onSelectInfluencer(inf)}
                  className="cursor-pointer transition-colors duration-150 group hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {/* Criador */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {inf.profile_pic_url ? (
                        <img
                          src={inf.profile_pic_url}
                          alt={inf.username}
                          className="w-9 h-9 rounded-full object-cover border shrink-0"
                          style={{ borderColor: 'var(--border-color)' }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0"
                          style={{
                            backgroundColor: 'var(--bg-card-secondary)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-semibold truncate transition-colors group-hover:text-blue-500"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {inf.full_name || cleanHandle}
                          </span>
                          {inf.ig_not_found && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0"
                              title="Instagram retornou perfil inexistente ou restrito"
                            >
                              <AlertTriangle size={9} /> @ fora do ar
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {igUrl ? (
                            <a
                              href={igUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline flex items-center gap-0.5 text-[11px] truncate transition-colors text-blue-600 dark:text-blue-400"
                            >
                              @{cleanHandle}
                              <ExternalLink size={9} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                              @{cleanHandle}
                            </span>
                          )}
                          {inf.niche && inf.niche !== 'Geral' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-500/10 text-zinc-500 truncate max-w-[90px]">
                              {inf.niche}
                            </span>
                          )}
                          {inf.source_query && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-500 font-medium truncate max-w-[110px]" title={`Descoberto pela busca: ${inf.source_query}`}>
                              🔍 {inf.source_query}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contato (WhatsApp + E-mail) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {inf.whatsapp && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                          <Phone size={10} className="shrink-0" />
                          <span>{inf.formatted_phone || inf.whatsapp}</span>
                        </span>
                      )}
                      {inf.email && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-medium max-w-[170px] truncate"
                          title={inf.email}
                        >
                          <Mail size={10} className="shrink-0" />
                          <span className="truncate">{inf.email}</span>
                        </span>
                      )}
                      {!hasContact && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          Sem contato ainda
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Audiência (Seguidores Reais + Engajamento) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-semibold"
                        style={{ color: inf.followers_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      >
                        {formatFollowersLabel(inf.followers_count, false)}
                      </span>
                      {inf.followers_count >= 15000 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25" title="Lead com audiência qualificada (+15k seguidores)">
                          +15k seg.
                        </span>
                      )}
                    </div>
                    {inf.followers_count > 0 ? (
                      <div className="mt-0.5">
                        {getEngagementBadge(inf.engagement_rate)}
                      </div>
                    ) : (
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Abra Ficha → Atualizar IG
                      </div>
                    )}
                  </td>

                  {/* Jogo & Stories Reais */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      {inf.campaign_game && (
                        <span className="inline-block w-fit px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/12 text-purple-600 dark:text-purple-300">
                          🎮 {inf.campaign_game}
                        </span>
                      )}
                      {inf.story_views_avg > 0 || inf.story_clicks_avg > 0 || inf.story_asking_price > 0 ? (
                        <div className="text-[11px] space-y-0.5">
                          {inf.story_views_avg > 0 && (
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              👁️ {formatNum(inf.story_views_avg)} views
                              {inf.story_clicks_avg > 0 ? ` • ${inf.story_clicks_avg} cl.` : ''}
                            </div>
                          )}
                          {inf.story_asking_price > 0 && (
                            <div className="font-bold text-amber-600 dark:text-amber-400">
                              💰 {formatMoney(inf.story_asking_price)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Preencher na Ficha
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Bio / Alerta */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {inf.is_agency && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                          <Building2 size={10} /> Agência
                        </span>
                      )}
                      {inf.promotes_raffle && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          <Ticket size={10} /> Rifa
                        </span>
                      )}
                      {inf.promotes_shopee && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                          <ShoppingBag size={10} /> Achadinhos
                        </span>
                      )}
                      {!inf.is_agency && !inf.promotes_raffle && !inf.promotes_shopee && (
                        inf.has_competitor ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                            <ShieldAlert size={10} className="shrink-0" />
                            <span>{inf.competitor_name || 'Concorrente'}</span>
                          </span>
                        ) : hasScrapedProfile ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            🌱 Virgem
                          </span>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Aguardando IG
                          </span>
                        )
                      )}
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getClassificationBadge(inf.classification, inf.score)}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={inf.status || 'Novo'}
                      onChange={(e) => onStatusChange(inf.id, e.target.value)}
                      className={`text-[11px] font-medium px-2 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${getStatusColor(
                        inf.status
                      )}`}
                    >
                      {PEDRO_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Observações */}
                  <td className="py-3 px-3 max-w-[180px]">
                    {inf.user_notes ? (
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }} title={inf.user_notes}>
                        {inf.user_notes}
                      </p>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectInfluencer(inf)
                      }}
                      className="px-2.5 py-1 rounded-lg border transition-all inline-flex items-center gap-1 text-[11px] font-semibold hover:border-blue-500/50"
                      style={{
                        backgroundColor: 'var(--bg-card-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                      title="Abrir ficha, preencher campos e copiar roteiros"
                    >
                      <Edit3 size={12} />
                      <span>Ficha</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        className="border-t px-4 py-3 flex items-center justify-between text-xs"
        style={{
          backgroundColor: 'var(--bg-card-secondary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)',
        }}
      >
        <div>
          Mostrando <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{influencers.length}</span> de{' '}
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{total}</span> criadores
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-2 font-medium" style={{ color: 'var(--text-primary)' }}>
            Página {page} de {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
