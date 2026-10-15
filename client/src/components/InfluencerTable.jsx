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
}) {
  const formatNum = (num) => {
    return new Intl.NumberFormat('pt-BR').format(num || 0)
  }

  const getEngagementBadge = (rate) => {
    const r = parseFloat(rate) || 0
    if (r >= 15) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {r.toFixed(1)}%
        </span>
      )
    }
    if (r >= 5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          {r.toFixed(1)}%
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        {r.toFixed(1)}%
      </span>
    )
  }

  const getClassificationBadge = (cls, score) => {
    switch (cls) {
      case 'OURO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm shadow-yellow-500/10">
            💎 OURO <span className="opacity-80">({score})</span>
          </span>
        )
      case 'PRATA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-400/20 text-slate-200 border border-slate-400/40">
            🥈 PRATA <span className="opacity-80">({score})</span>
          </span>
        )
      case 'BRONZE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-800/25 text-amber-300 border border-amber-700/40">
            🥉 BRONZE <span className="opacity-80">({score})</span>
          </span>
        )
      case 'LIXO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950/40 text-red-400 border border-red-900/50">
            🗑️ LIXO <span className="opacity-80">({score})</span>
          </span>
        )
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Fechado':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'Negociando':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Abordado':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Qualificado':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'Desqualificado':
        return 'bg-zinc-700/30 text-zinc-400 border-zinc-700'
      case 'Novo':
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
  }

  if (!loading && influencers.length === 0) {
    return (
      <div className="bg-apple-card border border-apple-border rounded-2xl p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-apple-surface border border-apple-border flex items-center justify-center text-apple-muted">
          <Inbox size={26} />
        </div>
        <h4 className="text-base font-semibold text-white mb-1">Nenhum influenciador encontrado</h4>
        <p className="text-xs text-apple-muted max-w-sm mx-auto mb-5">
          Tente ajustar os filtros de busca ou inicie uma nova varredura de perfis no nicho desejado.
        </p>
        <button
          onClick={onMineClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-blue-500/20"
        >
          <Sparkles size={14} />
          <span>Iniciar Mineração</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-apple-card border border-apple-border rounded-2xl overflow-hidden shadow-xl">
      {/* Table responsive container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-apple-surface border-b border-apple-border text-apple-muted font-medium">
              <th className="py-3.5 px-4">Criador</th>
              <th className="py-3.5 px-3">Seguidores</th>
              <th className="py-3.5 px-3">Média Reels</th>
              <th className="py-3.5 px-3">Engajamento</th>
              <th className="py-3.5 px-3">WhatsApp</th>
              <th className="py-3.5 px-3">Bio / Concorrente</th>
              <th className="py-3.5 px-3">Lead Score</th>
              <th className="py-3.5 px-3">Status Pipeline</th>
              <th className="py-3.5 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-border">
            {influencers.map((inf) => {
              const initials = (inf.full_name || inf.username || '?')
                .slice(0, 2)
                .toUpperCase()

              return (
                <tr
                  key={inf.id}
                  onClick={() => onSelectInfluencer(inf)}
                  className="table-row-hover cursor-pointer transition-colors duration-150 group"
                >
                  {/* Criador */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {inf.profile_pic_url ? (
                        <img
                          src={inf.profile_pic_url}
                          alt={inf.username}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-apple-surface border border-apple-border flex items-center justify-center font-bold text-apple-muted text-xs shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate group-hover:text-apple-blue transition-colors flex items-center gap-1.5">
                          <span>{inf.full_name || inf.username}</span>
                        </div>
                        <a
                          href={`https://instagram.com/${inf.username}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-apple-muted hover:text-white flex items-center gap-1 text-[11px] truncate transition-colors"
                        >
                          @{inf.username}
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Seguidores */}
                  <td className="py-3.5 px-3 font-medium text-white whitespace-nowrap">
                    {formatNum(inf.followers_count)}
                  </td>

                  {/* Média Reels */}
                  <td className="py-3.5 px-3 text-apple-muted whitespace-nowrap">
                    {formatNum(inf.avg_reels_views)}
                  </td>

                  {/* Taxa Engajamento */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getEngagementBadge(inf.engagement_rate)}
                  </td>

                  {/* WhatsApp */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {inf.whatsapp ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <Phone size={12} className="shrink-0" />
                        <span>Detectado</span>
                      </span>
                    ) : (
                      <span className="text-apple-muted">—</span>
                    )}
                  </td>

                  {/* Bio Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {inf.has_competitor ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-500/10 text-red-300 border border-red-500/25">
                        <ShieldAlert size={12} className="shrink-0" />
                        <span>{inf.competitor_name || 'Concorrente'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        🌱 Virgem
                      </span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getClassificationBadge(inf.classification, inf.score)}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={inf.status || 'Novo'}
                      onChange={(e) => onStatusChange(inf.id, e.target.value)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${getStatusColor(
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

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectInfluencer(inf)
                      }}
                      className="p-1.5 rounded-lg bg-apple-surface border border-apple-border text-apple-muted hover:text-white hover:border-white/20 transition-all inline-flex items-center justify-center"
                      title="Ver ficha completa"
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
      <div className="bg-apple-surface border-t border-apple-border px-4 py-3 flex items-center justify-between text-xs text-apple-muted">
        <div>
          Mostrando <span className="font-medium text-white">{influencers.length}</span> de{' '}
          <span className="font-medium text-white">{total}</span> criadores
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-apple-card border border-apple-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-2 font-medium text-white">
            Página {page} de {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-apple-card border border-apple-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
