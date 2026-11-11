/**
 * @pilar PILAR 4 — Financeiro: Publicidades & Metas
 */
import React, { useState } from 'react'
import { X, DollarSign, AlertCircle } from 'lucide-react'

const GAMES = ['Block Win', 'Bubble Win', 'Cust Win', 'Count Masters']
const getTodayISO = () => new Date().toISOString().split('T')[0]

export default function CreatePublicidadeModal({ open, onClose, onCreated, initialData = {} }) {
  if (!open) return null
  const formKey = initialData?.id
    ? `edit-${initialData.id}`
    : `new-${initialData?.influencer_username || 'blank'}`
  return (
    <CreatePublicidadeModalForm
      key={formKey}
      onClose={onClose}
      onCreated={onCreated}
      initialData={initialData}
    />
  )
}

function CreatePublicidadeModalForm({ onClose, onCreated, initialData = {} }) {
  const [influencerUsername, setInfluencerUsername] = useState(initialData.influencer_username || '')
  const [influencerName, setInfluencerName] = useState(initialData.influencer_name || '')
  const [whatsapp, setWhatsapp] = useState(initialData.whatsapp || '')
  const [game, setGame] = useState(initialData.game || 'Block Win')
  const [investedAmount, setInvestedAmount] = useState(initialData.invested_amount ?? '')
  const [returnAmount, setReturnAmount] = useState(initialData.return_amount ?? '')
  const [closureType, setClosureType] = useState(initialData.closure_type || 'Fixo')
  const [targetDepositors, setTargetDepositors] = useState(initialData.target_depositors ?? '')
  const [startDate, setStartDate] = useState(initialData.start_date || getTodayISO())
  const [endDate, setEndDate] = useState(initialData.end_date || '')
  const [deliveryStatus, setDeliveryStatus] = useState(initialData.delivery_status || 'Agendada')
  const [paymentStatus, setPaymentStatus] = useState(initialData.payment_status || 'Pendente')
  const [referralName, setReferralName] = useState(initialData.referral_name || '')
  const [referralCommission, setReferralCommission] = useState(initialData.referral_commission ?? '')
  const [notes, setNotes] = useState(initialData.notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isEditing = Boolean(initialData?.id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!influencerUsername.trim() || !investedAmount) {
      setError('Por favor, informe o @ do influenciador e o valor investido.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onCreated({
        influencer_username: influencerUsername.trim(),
        influencer_name: influencerName.trim() || influencerUsername.trim(),
        whatsapp: whatsapp.trim() || null,
        game,
        invested_amount: parseFloat(investedAmount) || 0,
        return_amount: returnAmount !== '' ? parseFloat(returnAmount) : null,
        closure_type: closureType,
        target_depositors: closureType === 'Por meta' ? parseInt(targetDepositors) || 0 : null,
        start_date: startDate || null,
        end_date: endDate || null,
        delivery_status: deliveryStatus,
        payment_status: paymentStatus,
        referral_name: referralName.trim() || null,
        referral_commission: parseFloat(referralCommission) || 0,
        notes: notes.trim(),
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao registrar publicidade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col border rounded-2xl shadow-2xl p-6 overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-zinc-500/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? 'Editar Publicidade' : 'Registrar Publicidade'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Controle de contrato, investimento, retorno e ROI da campanha
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-3.5 flex-1 text-xs">
          {/* Influenciador */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                @ Instagram *
              </label>
              <input
                type="text"
                value={influencerUsername}
                onChange={(e) => setInfluencerUsername(e.target.value)}
                placeholder="ex: eugael"
                required
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Nome do Criador
              </label>
              <input
                type="text"
                value={influencerName}
                onChange={(e) => setInfluencerName(e.target.value)}
                placeholder="ex: Gael"
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Jogo da Campanha (Dropdown Oficial) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Jogo / Campanha *
              </label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl cursor-pointer"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {GAMES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Tipo de Fechamento
              </label>
              <select
                value={closureType}
                onChange={(e) => setClosureType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl cursor-pointer"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="Fixo">Fixo (Valor fechado)</option>
                <option value="Por meta">Por meta de depositantes</option>
              </select>
            </div>
          </div>

          {closureType === 'Por meta' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
              <label className="block font-semibold" style={{ color: 'var(--text-primary)' }}>
                Meta de Depositantes (FTD)
              </label>
              <input
                type="number"
                value={targetDepositors}
                onChange={(e) => setTargetDepositors(e.target.value)}
                placeholder="ex: 50 ou 65 depositantes"
                required={closureType === 'Por meta'}
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-[10px] text-blue-500">
                Uma meta de depositantes será criada automaticamente no módulo de Metas.
              </span>
            </div>
          )}

          {/* Valores Financeiros */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Valor Investido (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                placeholder="ex: 400.00"
                required
                className="w-full px-3 py-2 border rounded-xl font-mono"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Retorno Gerado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                placeholder="Pode deixar vazio até apurar"
                className="w-full px-3 py-2 border rounded-xl font-mono"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Comissões de Indicação */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Indicado por (Opcional)
              </label>
              <input
                type="text"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="ex: Jhon"
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Comissão de Indicação (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={referralCommission}
                onChange={(e) => setReferralCommission(e.target.value)}
                placeholder="ex: 50.00"
                className="w-full px-3 py-2 border rounded-xl font-mono"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Status de Entrega e Pagamento */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Status de Entrega
              </label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl cursor-pointer"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="Agendada">Agendada</option>
                <option value="Postada">Postada</option>
                <option value="Ghost">Ghost (Pagou e não postou)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Status de Pagamento
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl cursor-pointer"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Data de Fim (Opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Observações
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acordo fechado no WhatsApp, postagem no sábado à tarde"
              className="w-full px-3 py-2 border rounded-xl"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-xl font-medium hover:bg-zinc-500/10"
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
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Publicidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
