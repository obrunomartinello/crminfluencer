import React, { useState } from 'react'
import {
  ExternalLink,
  MessageCircle,
  Send,
  AtSign,
  Edit3,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Archive,
} from 'lucide-react'

const COLUMNS = [
  {
    id: 'to_contact',
    title: 'Para Abordar',
    subtitle: 'Leads novos (1º contato)',
    targetStatus: 'Novo',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    match: (st) => !st || st === 'Novo',
  },
  {
    id: 'sent_waiting',
    title: 'Msg Enviada',
    subtitle: 'Já mandados aguardando',
    targetStatus: 'Mensagem Enviada',
    dotClass: 'bg-blue-600',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    match: (st) => st === 'Mensagem Enviada' || st === 'Sem resposta',
  },
  {
    id: 'negotiating',
    title: 'Em Negociação',
    subtitle: 'Pedir Stories & fechar valor',
    targetStatus: 'Em negociação',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    match: (st) => st === 'Em negociação' || st === 'Abordado',
  },
  {
    id: 'closed',
    title: 'Fechou',
    subtitle: 'Prontos para Publicidade',
    targetStatus: 'Fechou',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    match: (st) => st === 'Fechou' || st === 'Fechado',
  },
]

const REMARKETING_COL = {
  id: 'remarketing',
  title: 'Remarketing / Recusados',
  subtitle: 'Retomar depois ou arquivados',
  targetStatus: 'Recusado - Remarketing',
  dotClass: 'bg-amber-500',
  badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
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
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
      case 'PRATA':
        return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-400/30'
      case 'BRONZE':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30'
      default:
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    }
  }

  if (loading && influencers.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="animate-spin w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Organizando quadro Kanban...
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
          <span className="font-bold text-[11px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Fluxo diário:
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300">
            1. Pegue em Para Abordar
          </span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            2. Mande Whats/DM e clique "Já Mandei Msg"
          </span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300">
            3. Clique em "Ficha" para preencher Views e Preço
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowRemarketing((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-semibold transition-all ${
            showRemarketing
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
              : 'hover:bg-zinc-500/10'
          }`}
          style={{
            borderColor: showRemarketing ? undefined : 'var(--border-color)',
            color: showRemarketing ? undefined : 'var(--text-muted)',
          }}
        >
          <Archive size={12} />
          <span>
            {showRemarketing ? 'Ocultar' : 'Mostrar'} Remarketing / Recusados ({remarketingCount})
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
                isActive ? 'bg-blue-600 text-white border-transparent' : ''
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
                isDragOver ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: isDragOver ? undefined : 'var(--border-color)',
              }}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between gap-2 px-1 pb-3 border-b mb-3" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
                    <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
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
                        ? 'Fila zerada!'
                        : 'Nenhum lead nesta etapa'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {col.id === 'to_contact'
                        ? 'Todos os leads já foram mandados ou você pode minerar mais criadores.'
                        : 'Arraste um card para cá ou use o botão de avanço no card.'}
                    </p>
                    {col.id === 'to_contact' && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {onMineClick && (
                          <button
                            type="button"
                            onClick={onMineClick}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold"
                          >
                            <Sparkles size={12} />
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
                            <Send size={11} />
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
                        className="rounded-xl border p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
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
                                borderColor: 'var(--border-color)',
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
                                {inf.full_name || inf.username}
                              </div>
                              <a
                                href={`https://instagram.com/${inf.username}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-blue-500 hover:underline inline-flex items-center gap-0.5 truncate max-w-full"
                              >
                                @{inf.username}
                                <ExternalLink size={9} />
                              </a>
                            </div>
                          </div>

                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${getClsPill(inf.classification)}`}>
                            {inf.classification} {inf.score}
                          </span>
                        </div>

                        {/* Métricas & Canal */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-primary)' }}
                          >
                            {formatCompact(inf.followers_count)} seg
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: 'var(--bg-card-secondary)', color: 'var(--text-primary)' }}
                          >
                            {formatCompact(inf.avg_reels_views)} views
                          </span>
                          {inf.followers_count >= 15000 && (
                            <span className="px-1.5 py-0.5 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              15k+
                            </span>
                          )}
                          {inf.outreach_channel && (
                            <span className="px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {inf.outreach_channel === 'whatsapp' ? 'Whats' : 'Direct'}
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
                            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              Por onde mandou mensagem?
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
                                className="flex-1 py-1 px-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
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
                                className="flex-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <Send size={10} />
                                <span>Já Mandei Msg</span>
                              </button>
                            )}

                            {col.id === 'sent_waiting' && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(inf.id, 'Em negociação')}
                                className="flex-1 py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <ArrowRight size={10} />
                                <span>Respondeu</span>
                              </button>
                            )}

                            {col.id === 'negotiating' && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(inf.id, 'Fechou')}
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 size={10} />
                                <span>Fechou</span>
                              </button>
                            )}

                            {col.id === 'closed' && onCreatePublicidadeForInfluencer && (
                              <button
                                type="button"
                                onClick={() => onCreatePublicidadeForInfluencer(inf)}
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <DollarSign size={10} />
                                <span>Lançar Publi</span>
                              </button>
                            )}

                            {col.id === 'remarketing' && (
                              <button
                                type="button"
                                onClick={() => onStatusChange(inf.id, 'Em negociação')}
                                className="flex-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold"
                              >
                                Retomar
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
                              className="py-1 px-2 rounded-lg border text-[10px] font-semibold flex items-center gap-1 hover:border-blue-500/50"
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
