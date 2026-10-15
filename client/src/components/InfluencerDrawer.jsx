import React, { useState, useEffect } from 'react'
import {
  X,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Send,
  Save,
  FileText,
  TrendingUp,
  MessageCircle,
} from 'lucide-react'

export default function InfluencerDrawer({ influencer, onClose, onUpdate }) {
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [customPhone, setCustomPhone] = useState('')
  const [pitchType, setPitchType] = useState('auto') // 'auto' | 'virgem' | 'concorrente'
  const [pitchText, setPitchText] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    if (influencer) {
      setNotes(influencer.user_notes || '')
      setCustomPhone(influencer.whatsapp || '')
      generatePitchText(influencer, 'auto')
    }
  }, [influencer])

  if (!influencer) return null

  const formatNum = (num) => new Intl.NumberFormat('pt-BR').format(num || 0)

  const generatePitchText = (inf, type) => {
    const isVirgem = type === 'auto' ? !inf.has_competitor : type === 'virgem'
    const name = inf.full_name ? inf.full_name.split(' ')[0] : `@${inf.username}`
    const followers = formatNum(inf.followers_count)

    let generated = ''
    if (isVirgem) {
      generated = `Olá ${name}, tudo bem? Acompanho seu trabalho no Instagram (@${inf.username}) e achei sua audiência de ${followers} seguidores com um engajamento sensacional! 🚀\n\nRepresento uma marca 100% regulamentada no Brasil (.bet.br) e estamos selecionando criadores de conteúdo do seu nicho para parcerias exclusivas de afiliação e publicidade, com pagamentos garantidos de CPA + RevShare.\n\nVocê tem interesse em monetizar sua audiência de forma profissional e legalizada? Posso te apresentar nossa proposta sem compromisso?`
    } else {
      const comp = inf.competitor_name ? ` (como a ${inf.competitor_name})` : ''
      generated = `Olá ${name}, tudo bem? Acompanho seu conteúdo no perfil @${inf.username} e vi que você já atua no mercado de apostas e parcerias${comp}.\n\nEstamos lançando uma operação premium regulamentada (.bet.br) com uma das maiores tabelas de comissão do mercado, conversão otimizada e suporte comercial dedicado para grandes criadores.\n\nPodemos comparar suas métricas atuais com a nossa proposta de CPA agressivo e RevShare vitalício? Tenho certeza que você vai se surpreender com os ganhos reais.`
    }

    setPitchText(generated)
  }

  const handlePitchTypeChange = (type) => {
    setPitchType(type)
    generatePitchText(influencer, type)
  }

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchText)
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

  // Montagem da URL de disparo no WhatsApp
  const cleanPhone = (customPhone || influencer.whatsapp || '').replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(pitchText)}`
    : null

  const initials = (influencer.full_name || influencer.username || '?')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-apple-surface border-l border-apple-border h-full shadow-2xl flex flex-col transform transition-transform duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-apple-border flex items-start justify-between bg-apple-card/50">
          <div className="flex items-center gap-4">
            {influencer.profile_pic_url ? (
              <img
                src={influencer.profile_pic_url}
                alt={influencer.username}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-apple-card border border-apple-border flex items-center justify-center font-bold text-apple-muted text-base shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {influencer.full_name || influencer.username}
              </h2>
              <a
                href={`https://instagram.com/${influencer.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-apple-blue hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                @{influencer.username}
                <ExternalLink size={12} />
              </a>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-apple-muted border border-white/10">
                  Nicho: {influencer.niche || 'Geral'}
                </span>
                {influencer.has_competitor ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                    <ShieldAlert size={11} />
                    {influencer.competitor_name || 'Concorrente detectado'}
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    🌱 Audiência Virgem
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-apple-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score & Classification Banner */}
          <div className="bg-apple-card rounded-2xl p-4 border border-apple-border flex items-center justify-between">
            <div>
              <span className="text-xs text-apple-muted uppercase font-medium">Lead Score</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold text-white">{influencer.score}</span>
                <span className="text-xs text-apple-muted">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-apple-muted block mb-1">Classificação</span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-apple-surface border border-apple-border text-white">
                {influencer.classification === 'OURO' && '💎 OURO'}
                {influencer.classification === 'PRATA' && '🥈 PRATA'}
                {influencer.classification === 'BRONZE' && '🥉 BRONZE'}
                {influencer.classification === 'LIXO' && '🗑️ LIXO'}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div>
            <h4 className="text-xs font-semibold text-apple-muted uppercase tracking-wider mb-3">
              Auditoria de Engajamento Real
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-apple-card p-3 rounded-xl border border-apple-border">
                <span className="text-apple-muted block mb-1">Seguidores</span>
                <span className="text-base font-semibold text-white">
                  {formatNum(influencer.followers_count)}
                </span>
              </div>
              <div className="bg-apple-card p-3 rounded-xl border border-apple-border">
                <span className="text-apple-muted block mb-1">Média Views Reels</span>
                <span className="text-base font-semibold text-white">
                  {formatNum(influencer.avg_reels_views)}
                </span>
              </div>
              <div className="bg-apple-card p-3 rounded-xl border border-apple-border">
                <span className="text-apple-muted block mb-1">Taxa de Views</span>
                <span className="text-base font-semibold text-apple-blue">
                  {parseFloat(influencer.engagement_rate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Bio & Links */}
          <div>
            <h4 className="text-xs font-semibold text-apple-muted uppercase tracking-wider mb-2">
              Bio no Instagram
            </h4>
            <div className="bg-apple-card p-3.5 rounded-xl border border-apple-border text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {influencer.bio || <span className="text-apple-muted italic">Sem bio informada</span>}
            </div>
            {influencer.external_url && (
              <div className="mt-2 text-xs flex items-center gap-1.5 text-apple-muted">
                <span>Link da Bio:</span>
                <a
                  href={influencer.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-apple-blue hover:underline truncate inline-flex items-center gap-1"
                >
                  {influencer.external_url}
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* WhatsApp Phone Section */}
          <div className="bg-apple-card p-4 rounded-xl border border-apple-border">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-400" />
                <span>WhatsApp Comercial</span>
              </label>
              {influencer.whatsapp && (
                <span className="text-[11px] text-emerald-400 font-medium">Detectado na Bio</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                onBlur={handleSavePhone}
                placeholder="ex: 11999998888 ou 5511999998888"
                className="flex-1 px-3 py-2 bg-apple-surface border border-apple-border rounded-xl text-xs text-white placeholder-apple-muted focus:outline-none focus:border-apple-blue"
              />
              <button
                type="button"
                onClick={handleSavePhone}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-apple-border rounded-xl text-xs text-white transition-colors"
                title="Salvar telefone"
              >
                <Save size={13} />
              </button>
            </div>
          </div>

          {/* Pitch Generator */}
          <div className="bg-apple-card p-4 rounded-xl border border-apple-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-apple-blue" />
                <span>Gerador de Pitch Comercial</span>
              </h4>
              {/* Template selector pills */}
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handlePitchTypeChange('virgem')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    pitchType === 'virgem'
                      ? 'bg-apple-blue text-white'
                      : 'bg-apple-surface text-apple-muted hover:text-white'
                  }`}
                >
                  Virgem
                </button>
                <button
                  type="button"
                  onClick={() => handlePitchTypeChange('concorrente')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    pitchType === 'concorrente'
                      ? 'bg-apple-blue text-white'
                      : 'bg-apple-surface text-apple-muted hover:text-white'
                  }`}
                >
                  Concorrente
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={pitchText}
              onChange={(e) => setPitchText(e.target.value)}
              className="w-full p-3 bg-apple-surface border border-apple-border rounded-xl text-xs text-zinc-200 leading-relaxed resize-none focus:outline-none focus:border-apple-blue"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-apple-muted">
                Personalizado automaticamente com nome e seguidores
              </span>
              <button
                type="button"
                onClick={handleCopyPitch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-apple-surface hover:bg-white/5 border border-apple-border rounded-lg text-xs font-medium text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copiar Pitch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CRM Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-apple-muted uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} />
                <span>Histórico de Negociação & Notas</span>
              </h4>
              {savingNotes && (
                <span className="text-[11px] text-apple-blue animate-pulse">Salvando...</span>
              )}
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Digite suas anotações sobre este criador (salva automaticamente)..."
              className="w-full p-3 bg-apple-card border border-apple-border rounded-xl text-xs text-white placeholder-apple-muted resize-none focus:outline-none focus:border-apple-blue"
            />
          </div>
        </div>

        {/* Drawer Footer — WhatsApp Action */}
        <div className="p-4 border-t border-apple-border bg-apple-card/80">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all"
            >
              <MessageCircle size={18} />
              <span>Abrir WhatsApp com Pitch Pronto</span>
            </a>
          ) : (
            <div className="text-center py-2 text-xs text-apple-muted">
              ⚠️ Adicione o número de WhatsApp acima para habilitar o disparo em 1 clique
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
