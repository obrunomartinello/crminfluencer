/**
 * @pilar PILAR 3 — Funil SDR: Minerados, Kanban & Ficha (Ficha Completa)
 */
import React, { useState, useEffect } from 'react'
import {
  X,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  Target,
  FileText,
  Plus,
  AlertTriangle,
  Save,
  CheckCircle2,
  MessageCircle,
  AtSign,
} from 'lucide-react'
import { api } from '../lib/api'
import { PEDRO_STATUSES } from '../constants/nichePresets'

const GAMES = ['Block Win', 'Bubble Win', 'Cust Win', 'Count Masters']

export default function InfluencerDrawer({ influencer, onClose, onUpdate, onCreatePublicidadeForInfluencer }) {
  const [status, setStatus] = useState('Novo')
  const [outreachChannel, setOutreachChannel] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [campaignGame, setCampaignGame] = useState('')
  const [storyViewsAvg, setStoryViewsAvg] = useState('')
  const [storyClicksAvg, setStoryClicksAvg] = useState('')
  const [storyAskingPrice, setStoryAskingPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [drawerTab, setDrawerTab] = useState('resumo') // 'resumo' | 'publicidades' | 'metas' | 'scripts'
  const [scriptTab, setScriptTab] = useState('urgencia')
  const [savingForm, setSavingForm] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [isGhost, setIsGhost] = useState(false)

  // Dados unificados carregados da API
  const [fullProfile, setFullProfile] = useState(null)

  useEffect(() => {
    if (influencer) {
      setStatus(influencer.status || 'Novo')
      setOutreachChannel(influencer.outreach_channel || '')
      setCustomPhone(influencer.whatsapp || '')
      setCampaignGame(influencer.campaign_game || '')
      setStoryViewsAvg(influencer.story_views_avg ? String(influencer.story_views_avg) : '')
      setStoryClicksAvg(influencer.story_clicks_avg ? String(influencer.story_clicks_avg) : '')
      setStoryAskingPrice(influencer.story_asking_price ? String(influencer.story_asking_price) : '')
      setNotes(influencer.user_notes || '')
      setIsGhost(!!influencer.is_ghost || influencer.user_notes?.toLowerCase().includes('ghost'))
      setSavedFeedback(false)

      api.getInfluencerFullProfile(influencer.username)
        .then((res) => setFullProfile(res))
        .catch(() => setFullProfile(null))
    }
  }, [influencer])

  if (!influencer) return null

  const formatMoney = (num) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num || 0)
  const formatNum = (num) => new Intl.NumberFormat('pt-BR').format(num || 0)

  const name = influencer.full_name ? influencer.full_name.split(' ')[0] : `@${influencer.username}`
  const cleanPhone = (customPhone || '').replace(/\D/g, '')
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

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault()
    setSavingForm(true)
    setSavedFeedback(false)
    try {
      await onUpdate(influencer.id, {
        status,
        outreach_channel: outreachChannel || null,
        whatsapp: cleanPhone || null,
        campaign_game: campaignGame || null,
        story_views_avg: storyViewsAvg === '' ? 0 : parseInt(storyViewsAvg, 10) || 0,
        story_clicks_avg: storyClicksAvg === '' ? 0 : parseInt(storyClicksAvg, 10) || 0,
        story_asking_price: storyAskingPrice === '' ? 0 : parseFloat(storyAskingPrice) || 0,
        user_notes: notes,
        is_ghost: isGhost,
      })
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2500)
    } finally {
      setSavingForm(false)
    }
  }

  const handleQuickMarkSent = async (channel) => {
    const nextStatus = status === 'Novo' ? 'Mensagem Enviada' : status
    setStatus(nextStatus)
    setOutreachChannel(channel)
    setSavingForm(true)
    try {
      await onUpdate(influencer.id, {
        status: nextStatus,
        outreach_channel: channel,
        whatsapp: cleanPhone || null,
      })
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2500)
    } finally {
      setSavingForm(false)
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
  const contactedDateLabel = influencer.contacted_at
    ? new Date(influencer.contacted_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-fadeIn" onClick={onClose}>
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
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {status}
                </span>
                {campaignGame && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {campaignGame}
                  </span>
                )}
                {contactedDateLabel && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Mandado em {contactedDateLabel}
                  </span>
                )}
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

        {/* Barra de Contato Rápido & Ações Imediatas */}
        <div
          className="px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-emerald-500 shrink-0" />
            <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
              {formattedPhone || 'Sem WhatsApp cadastrado'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cleanPhone && (
              <a
                href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(currentMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
              >
                <MessageCircle size={12} />
                <span>Abrir WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleToggleGhost}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                isGhost
                  ? 'bg-red-500/15 border-red-500/40 text-red-500'
                  : 'hover:bg-zinc-500/10 text-zinc-500'
              }`}
              style={{ borderColor: isGhost ? undefined : 'var(--border-color)' }}
              title="Marcar como Ghost caso tenha sumido após contato ou pagamento"
            >
              {isGhost ? 'Ghost Ativo' : 'Marcar Ghost'}
            </button>
          </div>
        </div>

        {/* Segmented Tabs do Drawer */}
        <div
          className="flex border-b px-5 pt-2 gap-3 text-xs font-semibold shrink-0 overflow-x-auto"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card-secondary)' }}
        >
          <button
            onClick={() => setDrawerTab('resumo')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'resumo'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FileText size={13} />
            <span>Ficha & Preenchimento</span>
          </button>

          <button
            onClick={() => setDrawerTab('publicidades')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'publicidades'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <DollarSign size={13} />
            <span>Publicidades ({publicidadesList.length})</span>
          </button>

          <button
            onClick={() => setDrawerTab('metas')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'metas'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Target size={13} />
            <span>Metas ({metasList.length})</span>
          </button>

          <button
            onClick={() => setDrawerTab('scripts')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'scripts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles size={13} />
            <span>Scripts ({scriptTab})</span>
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: FICHA & PREENCHIMENTO SDR */}
          {drawerTab === 'resumo' && (
            <form onSubmit={handleSaveAll} className="space-y-4">
              {/* Bloco 1: Marcar Abordagem / Canal */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    1. Registro de Envio (Separar dos Novos)
                  </span>
                  {status === 'Novo' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Falta Abordar
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Já Mandado
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingForm}
                    onClick={() => handleQuickMarkSent('whatsapp')}
                    className={`flex-1 min-w-[150px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      outreachChannel === 'whatsapp' && status !== 'Novo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'hover:bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <MessageCircle size={14} />
                    <span>{status === 'Novo' ? 'Mandei no WhatsApp' : 'Canal: WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingForm}
                    onClick={() => handleQuickMarkSent('instagram')}
                    className={`flex-1 min-w-[150px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      outreachChannel === 'instagram' && status !== 'Novo'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                        : 'hover:bg-pink-500/10 border-pink-500/40 text-pink-600 dark:text-pink-400'
                    }`}
                  >
                    <AtSign size={14} />
                    <span>{status === 'Novo' ? 'Mandei no Direct IG' : 'Canal: Direct IG'}</span>
                  </button>
                </div>
              </div>

              {/* Bloco 2: Formulário Editável de Preenchimento SDR */}
              <div
                className="p-4 rounded-xl border space-y-3.5"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    2. O que Preencher deste Influenciador
                  </span>
                  {savedFeedback && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Ficha salva!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      Etapa Atual no Funil
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
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
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      WhatsApp (c/ DDD)
                    </label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="Ex: 11999887766"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      Jogo da Campanha
                    </label>
                    <select
                      value={campaignGame}
                      onChange={(e) => setCampaignGame(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">-- Definir jogo --</option>
                      {GAMES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      Valor Pedido p/ Publi (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={storyAskingPrice}
                      onChange={(e) => setStoryAskingPrice(e.target.value)}
                      placeholder="Ex: 500"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      Média Views Stories
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={storyViewsAvg}
                      onChange={(e) => setStoryViewsAvg(e.target.value)}
                      placeholder="Ex: 4500"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      Média Cliques Link Stories
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={storyClicksAvg}
                      onChange={(e) => setStoryClicksAvg(e.target.value)}
                      placeholder="Ex: 320"
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Observações & Histórico da Negociação
                  </label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Pediu 500 no pix, fechou por 400 + meta de depositantes..."
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {formatNum(influencer.followers_count)} seguidores • {formatNum(influencer.avg_reels_views)} views Reels
                  </span>
                  <button
                    type="submit"
                    disabled={savingForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-60"
                  >
                    {savingForm ? (
                      <span>Salvando...</span>
                    ) : (
                      <>
                        <Save size={13} />
                        <span>Salvar Ficha</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bio Resumida do Instagram */}
              {influencer.bio && (
                <div
                  className="p-3.5 rounded-xl border space-y-1"
                  style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Bio do Instagram
                  </span>
                  <p className="text-xs whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {influencer.bio}
                  </p>
                </div>
              )}

              {/* Card Financeiro Acumulado deste Criador */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
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
              {status === 'Fechou' && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Parceria Fechada!
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Lance agora a publicidade financeira desta campanha.
                    </div>
                  </div>
                  {onCreatePublicidadeForInfluencer && (
                    <button
                      type="button"
                      onClick={() => onCreatePublicidadeForInfluencer(influencer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-sm transition-all"
                    >
                      <Plus size={13} />
                      <span>Criar Publicidade</span>
                    </button>
                  )}
                </div>
              )}
            </form>
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
