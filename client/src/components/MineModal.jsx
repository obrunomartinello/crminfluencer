import React, { useState } from 'react'
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Users, Hash, ShieldCheck, Zap } from 'lucide-react'
import { NICHE_PRESETS } from '../constants/nichePresets'

export default function MineModal({ open, onClose, onMine }) {
  const [mode, setMode] = useState('suggested') // 'suggested' | 'hashtag'
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(25)
  const [filterAgencies, setFilterAgencies] = useState(true)
  const [activeNicheId, setActiveNicheId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!open) return null

  const handleSelectNiche = (preset) => {
    setActiveNicheId(preset.id)
    setMode('suggested')
    // Escolhe uma semente aleatória do preset para variar e não saturar
    const seeds = preset.defaultSeeds
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)]
    setQuery(`@${randomSeed}`)
  }

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
          setActiveNicheId(null)
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
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col border rounded-2xl shadow-2xl p-6 overflow-hidden transition-colors"
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
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Mineração de Criadores Autênticos
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Arbitragem de audiência barata, CPM baixo e alta conversão FTD (.bet.br)
            </p>
          </div>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Sub-nichos de Arbitragem do Playbook */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Playbook de Arbitragem — Sub-nichos Subprecificados
              </label>
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <Zap size={11} /> Auto-Lookalike Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NICHE_PRESETS.map((preset) => {
                const isSelected = activeNicheId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectNiche(preset)}
                    disabled={loading}
                    className="text-left p-2.5 rounded-xl border transition-all text-xs"
                    style={{
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card-secondary)',
                      borderColor: isSelected ? '#3B82F6' : 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                        {preset.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {preset.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode Selector */}
          <div
            className="flex p-1 rounded-xl border text-xs font-semibold"
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
              <span>Por Hashtag / Região</span>
            </button>
          </div>

          {/* Result Alerts */}
          {result && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>
                Varredura concluída! <strong>{result.imported}</strong> novos perfis qualificados e importados.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
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
                    ? 'ex: @varzeanosoficial ou @mundodasinuca'
                    : 'ex: #humornordestino, #varzea, #sinuca'
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

            {/* Filtro Anti-Agência e Compliance SPA/MF */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Compliance SPA/MF & Anti-Lixo Ativo
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Descarta perfis com risco menor de idade (+18), rifas e robôs
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
    </div>
  )
}
