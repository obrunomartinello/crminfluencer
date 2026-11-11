import React, { useState } from 'react'
import {
  ExternalLink,
  MessageCircle,
  AtSign,
  Edit3,
  ArrowRight,
  AlertTriangle,
  Archive,
} from 'lucide-react'

const COLUMNS = [
  {
    id: 'to_contact',
    title: '🎯 Para Abordar',
    subtitle: 'Leads novos (1ª ficha)',
    targetStatus: 'Novo',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
    match: (st) => !st || st === 'Novo',
  },
  {
    id: 'sent_waiting',
    title: '🚀 Msg Enviada',
    subtitle: 'Já mandados aguardando',
    targetStatus: 'Mensagem Enviada',
    dotClass: 'bg-indigo-600',
    badgeClass: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    match: (st) => st === 'Mensagem Enviada' || st === 'Sem resposta',
  },
  {
    id: 'negotiating',
    title: '🃏 Em Negociação',
    subtitle: 'Pedir Stories & fechar valor',
    targetStatus: 'Em negociação',
    dotClass: 'bg-purple-600',
    badgeClass: 'bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25',
    match: (st) => st === 'Em negociação' || st === 'Abordado',
  },
  {
    id: 'closed',
    title: '🏆 Fechou (Jackpot)',
    subtitle: 'Prontos para Publicidade',
    targetStatus: 'Fechou',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
    isJackpot: true,
    match: (st) => st === 'Fechou' || st === 'Fechado',
  },
]

const REMARKETING_COL = {
  id: 'remarketing',
  title: '♻️ Remarketing / Recusados',
  subtitle: 'Retomar depois ou arquivados',
  targetStatus: 'Recusado - Remarketing',
  dotClass: 'bg-rose-500',
  badgeClass: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25',
  match: (st) =>
    ['Recusado - Remarketing', 'Outro momento', 'Não interessado', 'Recusado - métricas ruins'].includes(st),
}

function formatCompact(num) {
  const n = Number(num || 0)
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDateShort(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function KanbanBoard({
  influencers = [],
  loading = false,
  onSelectInfluencer,
  onMarkSent,
  onStatusChange,
  onCreatePublicidadeForInfluencer,
  onMineClick,
  onOpenSentView,
}) {
  const [dragOverCol, setDragOverCol] = useState(null)
  const [pickingChannelForId, setPickingChannelForId] = useState(null)
  const [showRemarketing, setShowRemarketing] = useState(false)
  const [mobileColId, setMobileColId] = useState('to_contact')

  const activeColumns = showRemarketing ? [...COLUMNS, REMARKETING_COL] : COLUMNS
  const remarketingCount = influencers.filter((i) => REMARKETING_COL.match(i.status)).length

  const handleDragStart = (e, infId) => {
    e.dataTransfer.setData('text/plain', String(infId))
  }

  const handleDrop = async (e, col) => {
    e.preventDefault()
    setDragOverCol(null)
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    await onStatusChange(id, col.targetStatus)
  }

  const getClsPill = (cls) => {
    switch (cls) {
      case 'OURO':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
      case 'PRATA':
        return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-400/30'
      case 'BRONZE':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30'
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    }
  }

  const getClsLabel = (cls) => {
    switch (cls) {
      case 'OURO':
        return '💎 OURO'
      case 'PRATA':
        return '🥈 PRATA'
      case 'BRONZE':
        return '🥉 BRONZE'
      default:
        return cls || '—'
    }
  }

  if (loading && influencers.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="text-3xl casino-slot-bounce mb-2 select-none" aria-hidden="true">
          🎰
        </div>
        <div className="animate-spin w-6 h-6 border-3 border-emerald-500 border-t-amber-400 rounded-full mx-auto mb-3" />
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          Embaralhando cartas e carregando mesa Kanban...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Guia Passo-a-Passo Fixo + Toggle Remarketing */}
      <div
        className="rounded-2xl px-4 py-3 border flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>🎰</span> Fluxo da Mesa:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            🎯 1. Pegue em Para Abordar
          </span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            🚀 2. Mande Whats/DM e clique "Já Mandei Msg"
          </span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            🃏 3. Clique em "Ficha" p/ Views e Preço
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowRemarketing((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-semibold transition-all ${
            showRemarketing
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
              : 'hover:bg-zinc-500/10'
          }`}
          style={{
            borderColor: showRemarketing ? undefined : 'var(--border-color)',
            color: showRemarketing ? undefined : 'var(--text-muted)',
          }}
        >
          <Archive size={12} />
          <span>
            {showRemarketing ? 'Ocultar' : '♻️ Mostrar'} Remarketing / Recusados ({remarketingCount})
          </span>
        </button>
      </div>

      {/* Seletor de Coluna no Mobile */}
      <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1">
        {activeColumns.map((col) => {
          const count = influencers.filter((i) => col.match(i.status)).length
          const isActive = mobileColId === col.id
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileColId(col.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                isActive ? 'casino-btn-vegas border-transparent' : ''
              }`}
              style={{
                backgroundColor: isActive ? undefined : 'var(--bg-card)',
                borderColor: isActive ? undefined : 'var(--border-color)',
                color: isActive ? undefined : 'var(--text-primary)',
              }}
            >
              <span>{col.title}</span>
              <span className="opacity-80">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Grid de Colunas Kanban */}
      <div
        className={`grid gap-4 items-start ${
          showRemarketing ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        }`}
      >
        {activeColumns.map((col) => {
          const items = influencers.filter((i) => col.match(i.status))
          const isDragOver = dragOverCol === col.id
          const hiddenOnMobile = mobileColId !== col.id ? 'hidden lg:flex' : 'flex'

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragOverCol !== col.id) setDragOverCol(col.id)
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col)}
              className={`${hiddenOnMobile} flex-col rounded-2xl border p-3 transition-all min-h-[420px] max-h-[72vh] ${
                isDragOver ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
              }`}
              style={{
                backgroundColor: col.isJackpot ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card-secondary)',
                borderColor: isDragOver
                  ? undefined
                  : col.isJackpot
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'var(--border-color)',
              }}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between gap-2 px-1 pb-3 border-b mb-3" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass} ${col.isJackpot ? 'casino-jackpot-ring' : ''}`} />
                    <h3 className="text-xs font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      {col.title}
                    </h3>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {col.subtitle}
                  </p>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${col.badgeClass}`}>
                  {items.length}
                </span>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {items.length === 0 ? (
                  <div
                    className="rounded-xl border border-dashed p-5 text-center space-y-2.5"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {col.id === 'to_contact'
                        ? '🎰 Fila zerada!'
                        : '🎲 Nenhum lead nesta etapa'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {col.id === 'to_contact'
                        ? 'Todos os leads já foram mandados ou você pode girar a roleta e minerar mais criadores.'
                        : 'Arraste um card para cá ou use o botão de avanço no card.'}
                    </p>
                    {col.id === 'to_contact' && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {onMineClick && (
                          <button
                            type="button"
                            onClick={onMineClick}
                            className="casino-btn-vegas casino-shimmer inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                          >
                            <span>🎰</span>
                            <span>Minerar Novos Leads</span>
                          </button>
                        )}
                        {onOpenSentView && (
                          <button
                            type="button"
                            onClick={onOpenSentView}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border text-[11px] font-semibold"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                          >
                            <span>🚀</span>
                            <span>Ver Já Mandados</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  items.map((inf) => {
                    const cleanWa = (inf.whatsapp || '').replace(/\D/g, '')
                    const intlWa = cleanWa.startsWith('55') ? cleanWa : `55${cleanWa}`
                    const isPicking = pickingChannelForId === inf.id
                    const sentDate = formatDateShort(inf.contacted_at)
                    const missingWhats = !cleanWa
                    const missingViews = (col.id === 'sent_waiting' || col.id === 'negotiating') && !inf.story_views_avg
                    const missingPrice = col.id === 'negotiating' && !inf.story_asking_price

                    return (
                      <div
                        key={inf.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, inf.id)}
                        className={`casino-card-enter rounded-xl border p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                          col.isJackpot ? 'border-emerald-500/40' : ''
                        }`}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: col.isJackpot ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
                        }}
                      >
                        {/* Identidade */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="flex items-center gap-2 min-w-0 cursor-pointer"
                            onClick={() => onSelectInfluencer(inf)}
                          >
                            <div
                              className="w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
                              style={{
                                backgroundColor: 'var(--bg-card-secondary)',
                                borderColor: col.isJackpot ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {inf.profile_pic_url ? (
                                <img
                                  src={inf.profile_pic_url}
                                  alt={inf.username}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                (inf.full_name || inf.username || '?').slice(0, 2).toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                {col.isJackpot ? `🏆 ${inf.full_name || inf.username}` : (inf.full_name || inf.username)}
                              </div>
                              <a
                                href={`https://instagram.com/${inf.username}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 truncate max-w-full font-medium"
                              >
                                @{inf.username}
                                <ExternalLink size={9} />
                              </a>
                            </div>
                          </div>

                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${getClsPill(inf.classification)}`}>
                            {getClsLabel(inf.classification)} {inf.score}
                          </span>
                        </div>

                        {/* Métricas & Canal */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-primary)' }}
                          >
                            🎲 {formatCompact(inf.followers_count)} seg
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-primary)' }}
                          >
                            👁️ {formatCompact(inf.avg_reels_views)} views
                          </span>
                          {inf.followers_count >= 15000 && (
                            <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                              🔥 15k+
                            </span>
                          )}
                          {inf.outreach_channel && (
                            <span className="px-1.5 py-0.5 rounded font-semibold bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
                              {inf.outreach_channel === 'whatsapp' ? '💬 Whats' : '📩 Direct'}
                              {sentDate ? ` • ${sentDate}` : ''}
                            </span>
                          )}
                          {!inf.outreach_channel && sentDate && col.id !== 'to_contact' && (
                            <span className="px-1.5 py-0.5 rounded font-medium bg-zinc-500/10">
                              {sentDate}
                            </span>
                          )}
                        </div>

                        {/* Alertas do que falta preencher */}
                        {(missingWhats || missingViews || missingPrice) && (
                          <div className="flex flex-wrap gap-1">
                            {missingWhats && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertTriangle size={9} /> Falta Whats
                              </span>
                            )}
                            {missingViews && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertTriangle size={9} /> Falta Views Stories
                              </span>
                            )}
                            {missingPrice && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <AlertTriangle size={9} /> Falta Preço
                              </span>
                            )}
                          </div>
                        )}

                        {/* Botões Explícitos de Ação no Card */}
                        {isPicking ? (
                          <div className="pt-1 space-y-1.5">
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              🎲 Por onde disparou a mensagem?
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  setPickingChannelForId(null)
                                  await onMarkSent(inf, 'whatsapp')
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <MessageCircle size={11} />
                                <span>WhatsApp</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  setPickingChannelForId(null)
                                  await onMarkSent(inf, 'instagram')
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-rose-500 hover:brightness-110 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <AtSign size={11} />
                                <span>Direct IG</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            {col.id === 'to_contact' && (
                              <button
                                type="button"
                                onClick={() => setPickingChannelForId(inf.id)}
                                className="casino-btn-vegas casino-hover-spin flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <span className="casino-spin-target">🚀</span>
                                <span>Já Mandei Msg</span>
                              </button>
                            )}

                            {col.id === 'sent_waiting' && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(inf.id, 'Em negociação')}
                                className="casino-hover-spin flex-1 py-1 px-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <span className="casino-spin-target">🃏</span>
                                <span>Respondeu</span>
                              </button>
                            )}

                            {col.id === 'negotiating' && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(inf.id, 'Fechou')}
                                className="casino-btn-vegas casino-shimmer casino-hover-spin flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <span className="casino-spin-target">🏆</span>
                                <span>Fechou Jackpot</span>
                              </button>
                            )}

                            {col.id === 'closed' && onCreatePublicidadeForInfluencer && (
                              <button
                                type="button"
                                onClick={() => onCreatePublicidadeForInfluencer(inf)}
                                className="casino-btn-gold casino-shimmer flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <span>💰</span>
                                <span>Lançar Publi</span>
                              </button>
                            )}

                            {col.id === 'remarketing' && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(inf.id, 'Em negociação')}
                                className="flex-1 py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold"
                              >
                                🔄 Retomar
                              </button>
                            )}

                            {cleanWa && (
                              <a
                                href={`https://wa.me/${intlWa}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageCircle size={12} />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => onSelectInfluencer(inf)}
                              className="py-1 px-2 rounded-lg border text-[10px] font-semibold flex items-center gap-1 hover:border-emerald-500/50"
                              style={{
                                backgroundColor: 'var(--bg-card-secondary)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-primary)',
                              }}
                              title="Abrir ficha completa e preencher campos"
                            >
                              <Edit3 size={10} />
                              <span>Ficha</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
