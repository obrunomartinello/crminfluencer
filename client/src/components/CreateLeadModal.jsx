/**
 * @pilar PILAR 3 — Funil SDR: Minerados, Kanban & Ficha
 */
import React, { useState } from 'react'
import { X, UserPlus, DollarSign, TrendingUp, AlertCircle, Loader2, Mail } from 'lucide-react'
import { PEDRO_STATUSES } from '../constants/nichePresets'
import { cleanInstagramHandle } from '../lib/instagram'

export default function CreateLeadModal({ open, onClose, onCreated }) {
  if (!open) return null
  return <CreateLeadModalForm onClose={onClose} onCreated={onCreated} />
}

function CreateLeadModalForm({ onClose, onCreated }) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [followers, setFollowers] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [storyViews, setStoryViews] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [revenueGenerated, setRevenueGenerated] = useState('')
  const [status, setStatus] = useState('Novo')
  const [userNotes, setUserNotes] = useState('')
  const [niche, setNiche] = useState('Geral')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const formatMoney = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // Cálculo de ROI em tempo real
  const paidNum = parseFloat(paidAmount) || 0
  const revNum = parseFloat(revenueGenerated) || 0
  const netProfit = revNum - paidNum

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanUsername = cleanInstagramHandle(username)
    if (!cleanUsername) {
      setError('Informe um @ ou link de perfil válido do Instagram (ex: @nome ou instagram.com/nome)')
      return
    }

    setLoading(true)
    setError(null)

    const cleanPhone = whatsapp.replace(/\D/g, '')
    const cleanEmail = email.trim().toLowerCase()

    const payload = {
      username: cleanUsername,
      full_name: fullName.trim() || cleanUsername,
      followers_count: parseInt(followers, 10) || 0,
      whatsapp: cleanPhone || null,
      email: cleanEmail || null,
      story_views_avg: parseInt(storyViews, 10) || 0,
      paid_amount: paidNum,
      revenue_generated: revNum,
      status,
      niche: niche || 'Geral',
      user_notes: userNotes.trim(),
    }

    try {
      await onCreated(payload)
      // Limpar formulário
      setUsername('')
      setFullName('')
      setFollowers('')
      setWhatsapp('')
      setEmail('')
      setStoryViews('')
      setPaidAmount('')
      setRevenueGenerated('')
      setStatus('Novo')
      setUserNotes('')
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar criador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg border rounded-2xl shadow-2xl p-6 overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Cadastrar Criador / Parceiro
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Adicione parceiros existentes com histórico financeiro e métricas
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Linha 1: Username e Nome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                @username do Instagram *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: @humoristadovideo"
                required
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Nome do Criador
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex: João da Resenha"
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Linha 2: Seguidores, WhatsApp, E-mail e Nicho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="ex: 11999998888"
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                <Mail size={12} className="text-blue-500" />
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: contato@criador.com"
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Seguidores (opcional)
              </label>
              <input
                type="number"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                placeholder="deixe vazio se n/d"
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Nicho
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="Geral">Geral</option>
                <option value="Humor / Comédia">Humor / Comédia</option>
                <option value="Várzea / Futebol">Várzea / Futebol</option>
                <option value="Sinuca / Truco">Sinuca / Truco</option>
                <option value="Carros / Grau">Carros / Grau</option>
                <option value="Churrasco / Pesca">Churrasco / Pesca</option>
                <option value="Maternidade / Rotina">Maternidade / Rotina</option>
              </select>
            </div>
          </div>

          {/* Linha 3: Stories & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Média de Views nos Stories
              </label>
              <input
                type="number"
                value={storyViews}
                onChange={(e) => setStoryViews(e.target.value)}
                placeholder="preencher quando o criador enviar"
                disabled={loading}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Status no CRM
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
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
          </div>

          {/* Bloco Financeiro do Pedro (Opcional — só se já fechou publi) */}
          <details
            className="p-3 rounded-xl border"
            style={{
              backgroundColor: 'var(--bg-card-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <summary className="text-xs font-bold flex items-center justify-between cursor-pointer select-none" style={{ color: 'var(--text-primary)' }}>
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-500" />
                Histórico Financeiro Anterior (opcional — pago vs voltou)
              </span>
              {(paidNum > 0 || revNum > 0) && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    netProfit >= 0
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-500 border border-red-500/30'
                  }`}
                >
                  <TrendingUp size={12} />
                  {netProfit >= 0 ? `Lucro: +${formatMoney(netProfit)}` : `Prejuízo: ${formatMoney(netProfit)}`}
                </span>
              )}
            </summary>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  Quanto foi pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="ex: 500.00"
                  disabled={loading}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  Quanto voltou (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={revenueGenerated}
                  onChange={(e) => setRevenueGenerated(e.target.value)}
                  placeholder="ex: 1520.00"
                  disabled={loading}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </details>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Observações do Pedro
            </label>
            <textarea
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="ex: Criador de comédia regional, cobra 500 no pix, responde caixinha todo dia..."
              disabled={loading}
              className="w-full px-3 py-2 border rounded-xl text-xs font-medium resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-xl text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Salvar Criador</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
