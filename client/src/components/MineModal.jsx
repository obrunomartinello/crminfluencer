import React, { useState } from 'react'
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function MineModal({ open, onClose, onMine }) {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(25)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!open) return null

  const presets = ['apostas', 'futebol', 'cassino', 'lifestyle', 'dicas']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await onMine(query.trim(), count)
      setResult(data)
      setTimeout(() => {
        // Auto-fechar após 3 segundos em caso de sucesso
        if (data && data.imported > 0) {
          onClose()
          setResult(null)
          setQuery('')
        }
      }, 3000)
    } catch (err) {
      setError(err.message || 'Erro ao realizar varredura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-apple-surface border border-apple-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-apple-muted hover:text-white p-1 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Minerar com Apify</h3>
            <p className="text-xs text-apple-muted">
              Varredura automática, auditoria de Reels e leitura de bio
            </p>
          </div>
        </div>

        {/* Result Alerts */}
        {result && (
          <div className="mb-4 p-3 bg-apple-green/10 border border-apple-green/30 rounded-xl text-apple-green text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>
              Varredura concluída! <strong>{result.imported}</strong> novos perfis qualificados e importados.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-apple-red/10 border border-apple-red/30 rounded-xl text-apple-red text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-apple-muted mb-1.5">
              Hashtag ou Nicho Alvo
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ex: apostas, futebolaovivo, palpites"
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-apple-card border border-apple-border rounded-xl text-sm text-white placeholder-apple-muted focus:outline-none focus:border-apple-blue transition-colors"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-apple-muted self-center mr-1">Sugestões:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuery(p)}
                  disabled={loading}
                  className="px-2 py-0.5 bg-apple-card border border-apple-border rounded-md text-[11px] text-apple-muted hover:text-white hover:border-white/20 transition-all"
                >
                  #{p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-apple-muted">
                Quantidade de Perfis
              </label>
              <span className="text-xs font-semibold text-apple-blue">{count}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-apple-blue cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-apple-muted mt-0.5">
              <span>10 perfis</span>
              <span>50</span>
              <span>100 perfis</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-apple-card hover:bg-white/5 border border-apple-border rounded-xl text-xs font-medium text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Minerando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Iniciar Varredura</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
