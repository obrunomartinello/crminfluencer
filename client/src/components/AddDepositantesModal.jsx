import React, { useState } from 'react'
import { X, Plus, Target, CheckCircle2 } from 'lucide-react'

export default function AddDepositantesModal({ open, onClose, meta, onIncrement }) {
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)

  if (!open || !meta) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const num = parseInt(amount) || 1
    if (num <= 0) return

    setLoading(true)
    try {
      await onIncrement(meta.id, num)
      onClose()
    } catch (err) {
      alert('Erro ao atualizar depositantes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-sm border rounded-2xl shadow-2xl p-5 overflow-hidden transition-colors"
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
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              + Novos Depositantes
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              @{meta.influencer_username} — {meta.game}
            </p>
          </div>
        </div>

        <div className="p-3 bg-zinc-500/10 rounded-xl mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Alcançados Atuais:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{meta.reached_depositors}</strong>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Meta Total:</span>
            <strong className="text-blue-500">{meta.target_depositors} FTDs</strong>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Falta para a meta:</span>
            <strong className="text-amber-500">{meta.remaining_depositors}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Quantos novos depositantes confirmados?
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 border rounded-xl font-mono text-center text-lg font-bold"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              {loading ? 'Salvando...' : 'Confirmar (+) '}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
