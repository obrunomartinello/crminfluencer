import React from 'react'
import {
  ExternalLink,
  Phone,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Inbox,
  Building2,
  Ticket,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  UserPlus,
  MessageSquare,
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
      case 'Fechado':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
      case 'Negociando':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
      case 'Abordado':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
      case 'Qualificado':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
      case 'Desqualificado':
        return 'bg-zinc-400/10 text-zinc-500 border-zinc-400/20'
      case 'Novo':
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-400/25'
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
              <th className="py-3 px-3">Audiência</th>
              <th className="py-3 px-3">Stories & Cliques</th>
              <th className="py-3 px-3">Financeiro (Pago vs Voltou)</th>
              <th className="py-3 px-3">SDR & Bio</th>
              <th className="py-3 px-3">Lead Score</th>
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

              const paidNum = parseFloat(inf.paid_amount) || 0
              const revNum = parseFloat(inf.revenue_generated) || 0
              const hasFinancialData = paidNum > 0 || revNum > 0
              const netProfit = revNum - paidNum

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
                        <div
                          className="font-semibold truncate transition-colors group-hover:text-blue-500"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {inf.full_name || inf.username}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://instagram.com/${inf.username}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline flex items-center gap-0.5 text-[11px] truncate transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            @{inf.username}
                            <ExternalLink size={9} className="shrink-0" />
                          </a>
                          {inf.niche && inf.niche !== 'Geral' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-500/10 text-zinc-500">
                              {inf.niche}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Audiência (Seguidores + Engajamento) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatNum(inf.followers_count)}
                    </div>
                    <div className="mt-0.5">
                      {getEngagementBadge(inf.engagement_rate)}
                    </div>
                  </td>

                  {/* Stories & Cliques */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {inf.story_views_avg > 0 ? `${formatNum(inf.story_views_avg)} views` : '—'}
                    </div>
                    <div className="text-[11px] font-medium text-blue-500">
                      {inf.story_clicks_avg > 0 ? `~${formatNum(inf.story_clicks_avg)} cliques` : '—'}
                    </div>
                  </td>

                  {/* Financeiro do Pedro (Pago vs Voltou) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {hasFinancialData ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          Pago: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(paidNum)}</span>
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          Voltou: <span className="font-semibold text-emerald-500">{formatMoney(revNum)}</span>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              netProfit >= 0
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            }`}
                          >
                            {netProfit >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {netProfit >= 0 ? `+${formatMoney(netProfit)}` : formatMoney(netProfit)}
                          </span>
                        </div>
                      </div>
                    ) : inf.estimated_revenue > 0 ? (
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Proj: <span className="font-semibold text-blue-400">{formatMoney(inf.estimated_revenue)}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* SDR & Bio (Anti-Lixo + Concorrência + WhatsApp) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {inf.whatsapp && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <Phone size={10} className="shrink-0" />
                          <span>WhatsApp</span>
                        </span>
                      )}
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
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            🌱 Virgem
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
                      <option value="Novo">Novo</option>
                      <option value="Qualificado">Qualificado</option>
                      <option value="Abordado">Abordado</option>
                      <option value="Negociando">Negociando</option>
                      <option value="Fechado">Fechado</option>
                      <option value="Desqualificado">Desqualificado</option>
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
                      className="p-1.5 rounded-lg border transition-all inline-flex items-center justify-center hover:scale-105"
                      style={{
                        backgroundColor: 'var(--bg-card-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-muted)',
                      }}
                      title="Abrir ficha, roteiros e ROI"
                    >
                      <Eye size={14} />
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
