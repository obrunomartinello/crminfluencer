import React, { useState, useEffect } from 'react'
import {
  X,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Save,
  FileText,
  Calculator,
  MessageCircle,
  Building2,
  Ticket,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'

export default function InfluencerDrawer({ influencer, onClose, onUpdate }) {
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [customPhone, setCustomPhone] = useState('')
  const [activeTab, setActiveTab] = useState('urgencia') // 'urgencia' | 'transicao' | 'whatsapp' | 'storytelling'
  const [savingNotes, setSavingNotes] = useState(false)
  const [savingRoi, setSavingRoi] = useState(false)

  // Estados da Calculadora de ROI do Pedro
  const [clicks, setClicks] = useState(0)
  const [askingPrice, setAskingPrice] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [revenueGenerated, setRevenueGenerated] = useState(0)

  useEffect(() => {
    if (influencer) {
      setNotes(influencer.user_notes || '')
      setCustomPhone(influencer.whatsapp || '')
      setClicks(influencer.story_clicks_avg || 0)
      setAskingPrice(influencer.story_asking_price || 0)
      setPaidAmount(influencer.paid_amount || 0)
      setRevenueGenerated(influencer.revenue_generated || 0)
    }
  }, [influencer])

  if (!influencer) return null

  const formatNum = (num) => new Intl.NumberFormat('pt-BR').format(num || 0)
  const formatMoney = (num) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num || 0)

  const name = influencer.full_name ? influencer.full_name.split(' ')[0] : `@${influencer.username}`
  const followers = formatNum(influencer.followers_count)

  // Matemática da Calculadora de ROI do Pedro
  // Cada clique em link rende em média R$ 16 líquidos (depósito mínimo R$ 20 menos taxas de gateway)
  const clicksNum = Number(clicks) || 0
  const priceNum = Number(askingPrice) || 0
  const estimatedRevenue = clicksNum * 16 // R$ 16 por clique
  const netProfit = estimatedRevenue - priceNum
  const suggestedOffer = Math.round(estimatedRevenue * 0.7) // Proposta que garante 30% de margem

  let roiStatus = 'neutro'
  let roiText = 'Informe os cliques e o valor para calcular'
  if (clicksNum > 0 && priceNum > 0) {
    if (netProfit >= 0) {
      roiStatus = 'fechar'
      roiText = `🟢 FECHAR NA HORA! Lucro estimado de ${formatMoney(netProfit)}`
    } else {
      roiStatus = 'negociar'
      roiText = `🟡 NEGOCIAR! Oferta máxima recomendada: ${formatMoney(suggestedOffer)}`
    }
  }

  // Scripts de Abordagem do Pedro
  const scripts = {
    urgencia: `Ei ${name}, preciso falar contigo urgente... aconteceu alguma coisa...`,
    transicao: `Gostei muito do seu perfil, acho você um ótimo influenciador e queremos fechar uma parceria comercial.\n\nSobre os valores e detalhes eu sou apenas o prospectador de criadores. Me passa seu WhatsApp para que eu possa te encaminhar diretamente com a diretoria responsável?`,
    whatsapp: influencer.has_competitor
      ? `Olá ${name}! Acompanho seu conteúdo no perfil @${influencer.username} e vi que você já atua com apostas (como a ${influencer.competitor_name || 'concorrentes'}).\n\nTemos uma operação regulamentada no Brasil (.bet.br) com uma das maiores tabelas de comissão do mercado, CPA agressivo e RevShare vitalício. Podemos comparar suas métricas atuais com a nossa proposta?`
      : `Olá ${name}! Acompanho seu trabalho no Instagram e sua audiência de ${followers} seguidores tem um potencial gigante de monetização.\n\nRepresentamos uma marca 100% regulamentada no Brasil (.bet.br) com pagamentos garantidos de CPA + RevShare sem exclusividade. Quer conhecer nossa proposta sem compromisso?`,
    storytelling: `Briefing de Lançamento (Storytelling em 3 Stories que mais converte):\n\n• Story 1 (Abertura): Você falando naturalmente com a câmera, contextualizando que achou um jogo de habilidade legal e que muita gente está pedindo.\n• Story 2 (Gameplay): Gravação da tela do seu celular jogando e mostrando na prática como funciona.\n• Story 3 (Prova Social): Print da notificação de saque caindo na sua conta bancária provando que paga na hora com link direto.`,
  }

  const currentMessage = scripts[activeTab]

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await onUpdate(influencer.id, { user_notes: notes })
    } finally {
      setSavingNotes(false)
    }
  }

  const handleSavePhone = async () => {
    if (customPhone !== influencer.whatsapp) {
      const cleanPhone = customPhone.replace(/\D/g, '')
      await onUpdate(influencer.id, { whatsapp: cleanPhone })
    }
  }

  const handleSaveRoiMetrics = async () => {
    setSavingRoi(true)
    try {
      await onUpdate(influencer.id, {
        story_clicks_avg: clicksNum,
        story_asking_price: priceNum,
        estimated_revenue: estimatedRevenue,
        paid_amount: Number(paidAmount) || 0,
        revenue_generated: Number(revenueGenerated) || 0,
        roi_verdict: roiStatus === 'fechar' ? 'FECHAR' : roiStatus === 'negociar' ? 'NEGOCIAR' : 'DESCARTAR',
      })
    } finally {
      setSavingRoi(false)
    }
  }

  // URL de disparo no WhatsApp
  const cleanPhone = (customPhone || influencer.whatsapp || '').replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(currentMessage)}`
    : null

  const initials = (influencer.full_name || influencer.username || '?')
    .slice(0, 2)
    .toUpperCase()

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
          className="p-6 border-b flex items-start justify-between"
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-4">
            {influencer.profile_pic_url ? (
              <img
                src={influencer.profile_pic_url}
                alt={influencer.username}
                className="w-14 h-14 rounded-full object-cover border-2 shrink-0"
                style={{ borderColor: 'var(--border-color)' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full border flex items-center justify-center font-bold text-base shrink-0"
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
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {influencer.full_name || influencer.username}
              </h2>
              <a
                href={`https://instagram.com/${influencer.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                @{influencer.username}
                <ExternalLink size={12} />
              </a>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {influencer.is_agency && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 flex items-center gap-1">
                    <Building2 size={10} /> Agência / Assessoria
                  </span>
                )}
                {influencer.promotes_raffle && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                    <Ticket size={10} /> Promove Rifas
                  </span>
                )}
                {influencer.promotes_shopee && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 flex items-center gap-1">
                    <ShoppingBag size={10} /> Achadinhos
                  </span>
                )}
                {influencer.has_competitor ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center gap-1">
                    <ShieldAlert size={10} />
                    {influencer.competitor_name || 'Concorrente'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    🌱 Audiência Virgem
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-colors hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score & Classification Banner */}
          <div
            className="rounded-2xl p-4 border flex items-center justify-between shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Lead Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {influencer.score}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Classificação</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border shadow-sm" style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {influencer.classification === 'OURO' && '💎 OURO'}
                {influencer.classification === 'PRATA' && '🥈 PRATA'}
                {influencer.classification === 'BRONZE' && '🥉 BRONZE'}
                {influencer.classification === 'LIXO' && '🗑️ LIXO'}
              </span>
            </div>
          </div>

          {/* 1. CALCULADORA DE ROI DO PEDRO (Feature Estrela) */}
          <div
            className="rounded-2xl p-4 border shadow-sm space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Calculator size={15} className="text-emerald-500" />
                <span>Calculadora de ROI de Stories (Regra R$ 16)</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Líquido: R$ 16/clique
              </span>
            </div>

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Insira as métricas informadas pelo criador para calcular a viabilidade financeira e o teto da proposta:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Cliques no Link (print do criador)
                </label>
                <input
                  type="number"
                  min="0"
                  value={clicks}
                  onChange={(e) => setClicks(e.target.value)}
                  placeholder="ex: 150"
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Valor pedido pelos Stories (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="ex: 1500"
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div
              className="p-3 rounded-xl border flex flex-col gap-1.5"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Potencial Líquido Estimado ({clicksNum} × R$ 16):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(estimatedRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span style={{ color: 'var(--text-primary)' }}>Resultado da Análise:</span>
                <span
                  className={
                    roiStatus === 'fechar'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : roiStatus === 'negociar'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-500'
                  }
                >
                  {roiText}
                </span>
              </div>
            </div>

            {/* Histórico Financeiro Real (Pago vs Voltou) */}
            <div className="pt-2 border-t space-y-2 text-xs" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>
                  Histórico Real da Ação (Pós-Campanha)
                </span>
                {(Number(paidAmount) > 0 || Number(revenueGenerated) > 0) && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (Number(revenueGenerated) - Number(paidAmount)) >= 0
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    {(Number(revenueGenerated) - Number(paidAmount)) >= 0
                      ? `Lucro: +${formatMoney(Number(revenueGenerated) - Number(paidAmount))}`
                      : `Prejuízo: ${formatMoney(Number(revenueGenerated) - Number(paidAmount))}`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Cachê Pago (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="ex: 500"
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Retorno Gerado (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenueGenerated}
                    onChange={(e) => setRevenueGenerated(e.target.value)}
                    placeholder="ex: 1520"
                    className="w-full px-3 py-1.5 border rounded-lg font-semibold"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveRoiMetrics}
              disabled={savingRoi}
              className="w-full py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <Save size={13} />
              <span>{savingRoi ? 'Salvando...' : 'Salvar Métricas da Negociação no Perfil'}</span>
            </button>
          </div>

          {/* 2. Métricas de Auditoria do Instagram */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
              Métricas do Instagram
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="block mb-1" style={{ color: 'var(--text-muted)' }}>Seguidores</span>
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatNum(influencer.followers_count)}
                </span>
              </div>
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="block mb-1" style={{ color: 'var(--text-muted)' }}>Média Views Reels</span>
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatNum(influencer.avg_reels_views)}
                </span>
              </div>
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="block mb-1" style={{ color: 'var(--text-muted)' }}>Taxa de Views</span>
                <span className="text-base font-bold text-blue-500">
                  {parseFloat(influencer.engagement_rate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. Bio & Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Bio no Instagram
            </h4>
            <div
              className="p-3 rounded-xl border text-xs whitespace-pre-wrap leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {influencer.bio || <span className="italic" style={{ color: 'var(--text-muted)' }}>Sem bio informada</span>}
            </div>
            {influencer.external_url && (
              <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Link da Bio:</span>
                <a
                  href={influencer.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline truncate inline-flex items-center gap-1 font-medium"
                >
                  {influencer.external_url}
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* 4. WhatsApp Comercial */}
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Phone size={14} className="text-emerald-500" />
                <span>WhatsApp Comercial</span>
              </label>
              {influencer.whatsapp && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Detectado na Bio</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                onBlur={handleSavePhone}
                placeholder="ex: 11999998888 ou 5511999998888"
                className="flex-1 px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={handleSavePhone}
                className="px-3 py-2 border rounded-xl text-xs transition-colors hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                title="Salvar telefone"
              >
                <Save size={13} />
              </button>
            </div>
          </div>

          {/* 5. PLAYBOOK DE MENSAGENS DO PEDRO (4 ETAPAS) */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Sparkles size={14} className="text-blue-500" />
                <span>Scripts de Abordagem do Pedro</span>
              </h4>
            </div>

            {/* Abas das 4 Fases */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('urgencia')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'urgencia'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  borderColor: activeTab === 'urgencia' ? 'transparent' : 'var(--border-color)',
                  color: activeTab === 'urgencia' ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                1. Direct Urgência
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transicao')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'transicao'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  borderColor: activeTab === 'transicao' ? 'transparent' : 'var(--border-color)',
                  color: activeTab === 'transicao' ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                2. Direct Transição SDR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'whatsapp'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  borderColor: activeTab === 'whatsapp' ? 'transparent' : 'var(--border-color)',
                  color: activeTab === 'whatsapp' ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                3. WhatsApp Pitch
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('storytelling')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'storytelling'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  borderColor: activeTab === 'storytelling' ? 'transparent' : 'var(--border-color)',
                  color: activeTab === 'storytelling' ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                4. Storytelling 3 Stories
              </button>
            </div>

            <textarea
              rows={4}
              readOnly
              value={currentMessage}
              className="w-full p-3 border rounded-xl text-xs leading-relaxed resize-none focus:outline-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {activeTab === 'urgencia' && 'Copia e manda no direct do Instagram após curtir os stories'}
                {activeTab === 'transicao' && 'Para responder o criador e puxar pro WhatsApp'}
                {activeTab === 'whatsapp' && 'Mensagem de apresentação no WhatsApp'}
                {activeTab === 'storytelling' && 'Roteiro de 3 Stories para enviar ao criador'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-500">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copiar Script</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 6. Histórico de Negociação */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <FileText size={13} />
                <span>Histórico de Negociação & Notas</span>
              </h4>
              {savingNotes && (
                <span className="text-[11px] text-blue-500 font-medium animate-pulse">Salvando notas...</span>
              )}
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Digite anotações sobre este criador (salva automaticamente ao clicar fora)..."
              className="w-full p-3 border rounded-xl text-xs resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Drawer Footer — WhatsApp Action */}
        <div
          className="p-4 border-t flex items-center gap-2"
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98 transition-all"
            >
              <MessageCircle size={17} />
              <span>Abrir WhatsApp com este Script</span>
            </a>
          ) : (
            <div className="w-full text-center py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              ⚠️ Insira o número no campo de WhatsApp acima para habilitar o disparo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
