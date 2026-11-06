import React, { useState, useEffect } from 'react'
import {
  X,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Building2,
  Ticket,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  FileText,
  UserCheck,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { api } from '../lib/api'

export default function InfluencerDrawer({ influencer, onClose, onUpdate, onCreatePublicidadeForInfluencer }) {
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [customPhone, setCustomPhone] = useState('')
  const [drawerTab, setDrawerTab] = useState('resumo') // 'resumo' | 'publicidades' | 'metas' | 'scripts'
  const [scriptTab, setScriptTab] = useState('urgencia')
  const [savingNotes, setSavingNotes] = useState(false)
  const [isGhost, setIsGhost] = useState(false)

  // Dados unificados carregados da API
  const [fullProfile, setFullProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (influencer) {
      setNotes(influencer.user_notes || '')
      setCustomPhone(influencer.whatsapp || '')
      setIsGhost(!!influencer.is_ghost || influencer.user_notes?.toLowerCase().includes('ghost'))

      // Carregar perfil unificado completo
      setLoadingProfile(true)
      api.getInfluencerFullProfile(influencer.username)
        .then((res) => setFullProfile(res))
        .catch(() => setFullProfile(null))
        .finally(() => setLoadingProfile(false))
    }
  }, [influencer])

  if (!influencer) return null

  const formatMoney = (num) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num || 0)
  const formatNum = (num) => new Intl.NumberFormat('pt-BR').format(num || 0)

  const name = influencer.full_name ? influencer.full_name.split(' ')[0] : `@${influencer.username}`
  const cleanPhone = (customPhone || influencer.whatsapp || '').replace(/\D/g, '')
  const formattedPhone = cleanPhone.length === 11
    ? `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`
    : cleanPhone.length === 10
    ? `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`
    : cleanPhone

  const intlPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

  // Scripts de Abordagem do Pedro
  const scripts = {
    urgencia: `Ei ${name}, preciso falar contigo urgente... aconteceu alguma coisa...`,
    transicao: `Gostei muito do seu perfil, acho você um ótimo influenciador e queremos fechar uma parceria comercial.\n\nSobre os valores e detalhes eu sou apenas o prospectador de criadores. Me passa seu WhatsApp para que eu possa te encaminhar diretamente com a diretoria responsável?`,
    whatsapp: `Olá ${name}! Acompanho seu trabalho no perfil @${influencer.username} e sua audiência tem um alinhamento perfeito com nossos jogos (.bet.br).\n\nTrabalhamos com pagamentos garantidos de Fixo ou Meta de Depositantes sem exclusividade. Quer conhecer nossa proposta comercial?`,
    storytelling: `Briefing de Lançamento (Storytelling em 3 Stories que mais converte):\n\n• Story 1 (Abertura): Você falando naturalmente com a câmera, contextualizando que achou um jogo de habilidade legal e que muita gente está pedindo.\n• Story 2 (Gameplay): Gravação da tela do seu celular jogando e mostrando na prática como funciona.\n• Story 3 (Prova Social): Print da notificação de saque caindo na sua conta bancária provando que paga na hora com link direto.`,
  }

  const currentMessage = scripts[scriptTab] || scripts.urgencia

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await onUpdate(influencer.id, { user_notes: notes, is_ghost: isGhost })
    } finally {
      setSavingNotes(false)
    }
  }

  const handleToggleGhost = async () => {
    const nextVal = !isGhost
    setIsGhost(nextVal)
    await onUpdate(influencer.id, { is_ghost: nextVal })
  }

  const initials = (influencer.full_name || influencer.username || '?')
    .slice(0, 2)
    .toUpperCase()

  const publicidadesList = fullProfile?.publicidades || []
  const metasList = fullProfile?.metas || []
  const metrics = fullProfile?.metrics || {}

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div
        className="relative w-full max-w-xl h-full shadow-2xl flex flex-col transform transition-transform duration-300 border-l"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="p-5 border-b flex items-start justify-between shrink-0"
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3.5">
            {influencer.profile_pic_url ? (
              <img
                src={influencer.profile_pic_url}
                alt={influencer.username}
                className="w-12 h-12 rounded-full object-cover border-2 shrink-0"
                style={{ borderColor: 'var(--border-color)' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full border flex items-center justify-center font-bold text-sm shrink-0"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)',
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {influencer.full_name || influencer.username}
                </h2>
                {isGhost && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30 flex items-center gap-1">
                    <AlertTriangle size={10} /> Ghost
                  </span>
                )}
              </div>
              <a
                href={`https://instagram.com/${influencer.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
              >
                @{influencer.username}
                <ExternalLink size={11} />
              </a>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {influencer.campaign_game && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {influencer.campaign_game}
                  </span>
                )}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400">
                  Status: {influencer.status || 'Novo'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-500/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Contato Rápido & WhatsApp */}
        <div
          className="px-5 py-2.5 border-b flex items-center justify-between text-xs shrink-0"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-emerald-500 shrink-0" />
            <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
              {formattedPhone ? formattedPhone : 'Sem WhatsApp informado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cleanPhone ? (
              <a
                href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(currentMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
              >
                <Phone size={12} />
                <span>Abrir WhatsApp</span>
              </a>
            ) : null}

            {/* Toggle Ghost */}
            <button
              onClick={handleToggleGhost}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                isGhost
                  ? 'bg-red-500/15 border-red-500/40 text-red-500'
                  : 'hover:bg-zinc-500/10 text-zinc-400'
              }`}
              style={{ borderColor: isGhost ? undefined : 'var(--border-color)' }}
              title="Marcar como Ghost caso tenha sumido após contato ou pagamento"
            >
              {isGhost ? 'Flag: Ghost Ativo' : 'Marcar Ghost'}
            </button>
          </div>
        </div>

        {/* Segmented Tabs do Drawer */}
        <div
          className="flex border-b px-5 pt-2 gap-2 text-xs font-semibold shrink-0"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card-secondary)' }}
        >
          <button
            onClick={() => setDrawerTab('resumo')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              drawerTab === 'resumo'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <FileText size={13} />
            <span>Resumo & Notas</span>
          </button>

          <button
            onClick={() => setDrawerTab('publicidades')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              drawerTab === 'publicidades'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <DollarSign size={13} />
            <span>Publicidades ({publicidadesList.length})</span>
          </button>

          <button
            onClick={() => setDrawerTab('metas')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              drawerTab === 'metas'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Target size={13} />
            <span>Metas ({metasList.length})</span>
          </button>

          <button
            onClick={() => setDrawerTab('scripts')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              drawerTab === 'scripts'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Sparkles size={13} />
            <span>Scripts do Pedro</span>
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB 1: RESUMO & NOTAS */}
          {drawerTab === 'resumo' && (
            <div className="space-y-4">
              {/* Card Financeiro Acumulado deste Criador */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Histórico Financeiro Acumulado
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Total Investido</span>
                    <strong className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatMoney(metrics.totalInvested || influencer.paid_amount || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Retorno Gerado</span>
                    <strong className="text-sm font-mono text-emerald-500">
                      {formatMoney(metrics.totalReturned || influencer.revenue_generated || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">ROI Acumulado</span>
                    <strong
                      className={`text-sm font-mono ${
                        metrics.accumulatedRoi !== null && metrics.accumulatedRoi >= 0
                          ? 'text-emerald-500'
                          : metrics.accumulatedRoi !== null
                          ? 'text-red-500'
                          : 'text-zinc-400'
                      }`}
                    >
                      {metrics.accumulatedRoi !== null ? `${(metrics.accumulatedRoi * 100).toFixed(1)}%` : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Botão se o status for Fechou */}
              {influencer.status === 'Fechou' && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Parceria Fechada!
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Lance agora a publicidade financeira desta campanha.
                    </div>
                  </div>
                  {onCreatePublicidadeForInfluencer && (
                    <button
                      onClick={() => onCreatePublicidadeForInfluencer(influencer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-sm transition-all"
                    >
                      <Plus size={13} />
                      <span>Criar Publicidade</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bloco de Observações do Pedro */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Observações & Histórico da Negociação
                  </label>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="text-blue-500 hover:text-blue-400 font-semibold text-[11px] flex items-center gap-1"
                  >
                    {savingNotes ? 'Salvando...' : 'Salvar Nota'}
                  </button>
                </div>
                <textarea
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pediu 500 no pix, fechou por 400 + indicação do fulano..."
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PUBLICIDADES DELE */}
          {drawerTab === 'publicidades' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                  Campanhas Realizadas ({publicidadesList.length})
                </span>
                {onCreatePublicidadeForInfluencer && (
                  <button
                    onClick={() => onCreatePublicidadeForInfluencer(influencer)}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold"
                  >
                    <Plus size={13} /> Nova Publi
                  </button>
                )}
              </div>

              {publicidadesList.length === 0 ? (
                <div className="p-8 text-center border rounded-xl border-dashed text-zinc-500">
                  Nenhuma publicidade registrada ainda para este criador.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {publicidadesList.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border space-y-2 transition-colors"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-500/10 text-blue-500">
                          {p.game}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.delivery_status === 'Postada'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : p.delivery_status === 'Ghost'
                                ? 'bg-red-500/15 text-red-500'
                                : 'bg-blue-500/15 text-blue-500'
                            }`}
                          >
                            {p.delivery_status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.payment_status === 'Pago'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}
                          >
                            {p.payment_status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-sans">Investido:</span>
                          <strong>{formatMoney(p.invested_amount)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-sans">Retorno:</span>
                          <strong className="text-emerald-500">{formatMoney(p.return_amount)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-sans">ROI:</span>
                          <strong className={p.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {p.roi !== null ? `${(p.roi * 100).toFixed(1)}%` : '—'}
                          </strong>
                        </div>
                      </div>

                      {p.notes && (
                        <div className="text-[10px] text-zinc-400 bg-zinc-500/10 p-2 rounded-lg">
                          {p.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: METAS DELE */}
          {drawerTab === 'metas' && (
            <div className="space-y-3">
              <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                Metas de Depositantes (FTDs)
              </span>

              {metasList.length === 0 ? (
                <div className="p-8 text-center border rounded-xl border-dashed text-zinc-500">
                  Nenhuma meta de depositantes vinculada a este criador.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metasList.map((m) => {
                    const pct = Math.min(Math.round((m.progress_pct || 0) * 100), 100)
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border space-y-2"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                            {m.game}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'Meta atingida'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-blue-500/15 text-blue-500'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span>
                              {m.reached_depositors} de {m.target_depositors} FTDs
                            </span>
                            <span className="font-bold text-blue-500">{pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-500/20 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Falta: {m.remaining_depositors}</span>
                          <span>CPA: {m.cpa ? formatMoney(m.cpa) : '—'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCRIPTS DO PEDRO */}
          {drawerTab === 'scripts' && (
            <div className="space-y-4">
              <div
                className="flex p-1 rounded-xl border text-[11px] font-semibold"
                style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
              >
                {['urgencia', 'transicao', 'whatsapp', 'storytelling'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setScriptTab(st)}
                    className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
                      scriptTab === st ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div
                className="p-3.5 rounded-xl border relative font-mono text-xs whitespace-pre-line leading-relaxed"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {currentMessage}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:bg-zinc-500/10 transition-colors text-xs font-semibold"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar Script'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
