import React, { useState } from 'react'
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Users, Hash, ShieldCheck } from 'lucide-react'

export default function MineModal({ open, onClose, onMine }) {
  const [mode, setMode] = useState('suggested') // 'suggested' | 'hashtag'
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(25)
  const [filterAgencies, setFilterAgencies] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!open) return null

  const presets = [
    { label: '@humoristapovao', type: 'suggested' },
    { label: '#humor', type: 'hashtag' },
    { label: '#nordeste', type: 'hashtag' },
    { label: '#vivencia', type: 'hashtag' },
    { label: '#maternidade', type: 'hashtag' },
  ]

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
        if (data && data.imported > 0) {
          onClose()
          setResult(null)
          setQuery('')
        }
      }, 3000)
    } catch (err) {
      setError(err.message || 'Erro ao realizar varredura na Apify')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md border rounded-2xl shadow-2xl p-6 overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Mineração de Criadores Autênticos
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Focado em criadores soltos ("povão"), sem agências
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div
          className="flex p-1 rounded-xl border mb-4 text-xs font-semibold"
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('suggested')
              if (query.startsWith('#')) setQuery('')
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'suggested'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-blue-500'
            }`}
            style={{ color: mode === 'suggested' ? '#FFFFFF' : 'var(--text-muted)' }}
          >
            <Users size={13} />
            <span>Contas Sugeridas (Lookalike)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('hashtag')
              if (query.startsWith('@')) setQuery('')
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'hashtag'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-blue-500'
            }`}
            style={{ color: mode === 'hashtag' ? '#FFFFFF' : 'var(--text-muted)' }}
          >
            <Hash size={13} />
            <span>Por Hashtag / Nicho</span>
          </button>
        </div>

        {/* Result Alerts */}
        {result && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>
              Varredura concluída! <strong>{result.imported}</strong> novos perfis qualificados e importados.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              {mode === 'suggested'
                ? 'Criador Semente (@username)'
                : 'Hashtag ou Palavra-Chave'}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'suggested'
                  ? 'ex: @whinderssonnunes ou nome de humorista regional'
                  : 'ex: humor, comedia, nordeste, rotina'
              }
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] self-center mr-1" style={{ color: 'var(--text-muted)' }}>
                Ideias:
              </span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(p.label)
                    setMode(p.type)
                  }}
                  disabled={loading}
                  className="px-2 py-0.5 border rounded-md text-[11px] transition-all"
                  style={{
                    backgroundColor: 'var(--bg-card-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Quantidade de Perfis
              </label>
              <span className="text-xs font-bold text-blue-500">{count}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <span>5 perfis</span>
              <span>25</span>
              <span>50 perfis</span>
            </div>
          </div>

          {/* Filtro Anti-Agência Ativo */}
          <div
            className="p-3 rounded-xl border flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'var(--bg-card-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Filtro Anti-Agência e Anti-Lixo
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Descarta assessorias, rifas e perfis de achadinhos
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterAgencies}
              onChange={(e) => setFilterAgencies(e.target.checked)}
              className="accent-blue-600 w-4 h-4 cursor-pointer"
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
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Extraindo Perfis...</span>
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
