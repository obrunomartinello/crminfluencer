import React, { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Search, ShieldCheck, Zap, Radio } from 'lucide-react'
import { NICHE_PRESETS } from '../constants/nichePresets'
import { api } from '../lib/api'

export default function MineModal({ open, onClose, onComplete }) {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(20)
  const [activeNicheId, setActiveNicheId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const pollingRef = useRef(null)
  const timerRef = useRef(null)

  // Limpeza de intervalos ao fechar ou desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!open) return null

  const handleSelectNiche = (preset) => {
    setActiveNicheId(preset.id)
    const keywords = preset.defaultKeywords
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
    setQuery(randomKeyword)
  }

  const handleStartSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setElapsedSecs(0)

    try {
      // 1. Iniciar busca assíncrona (<500ms)
      const startRes = await api.startMine(query.trim(), count)
      setJobId(startRes.jobId)

      // Se o job já veio concluído (ex: mock ou cache imediato)
      if (startRes.status === 'COMPLETED') {
        setResult({ imported: startRes.imported || count })
        setLoading(false)
        if (onComplete) onComplete()
        setTimeout(() => {
          onClose()
          setResult(null)
        }, 2500)
        return
      }

      // 2. Iniciar contador de tempo decorrido
      timerRef.current = setInterval(() => {
        setElapsedSecs((prev) => prev + 1)
      }, 1000)

      // 3. Iniciar polling leve de status (a cada 2.5 segundos)
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await api.getMineStatus(startRes.jobId)
          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollingRef.current)
            clearInterval(timerRef.current)
            setResult({ imported: statusRes.imported })
            setLoading(false)
            if (onComplete) onComplete()
            setTimeout(() => {
              onClose()
              setResult(null)
              setQuery('')
              setActiveNicheId(null)
            }, 2500)
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollingRef.current)
            clearInterval(timerRef.current)
            setError(statusRes.error || 'A varredura da Apify falhou. Tente outro termo.')
            setLoading(false)
          }
        } catch (pollErr) {
          console.warn('[mine] Erro no polling de status:', pollErr.message)
        }
      }, 2500)
    } catch (err) {
      setError(err.message || 'Erro ao iniciar varredura')
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
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-zinc-500/10"
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
              Busca de Criadores por Palavra-Chave
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Motor assíncrono: vasculha o Instagram em background e qualifica no CRM
            </p>
          </div>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Sub-nichos de Arbitragem do Playbook */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Playbook do Pedro — Sub-nichos com CPM Barato
              </label>
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <Zap size={11} /> Palavras-Chave Quentes
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

          {/* Status / Loading Progress Card */}
          {loading && (
            <div
              className="p-4 rounded-xl border space-y-2 animate-pulse"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                  <Radio size={14} className="animate-spin" />
                  <span>Varredura Ativa na Apify... ({elapsedSecs}s)</span>
                </div>
                <span className="text-[10px] text-blue-500 font-mono">Job: {jobId ? jobId.slice(0, 8) : '...'}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                Buscando criadores públicos no Instagram para <strong>"{query}"</strong>.
              </p>
              <div className="w-full h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(elapsedSecs * 7, 95)}%` }}
                />
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                💡 A busca roda em background no servidor. Você não perde os dados mesmo se fechar esta janela.
              </p>
            </div>
          )}

          {/* Result Alerts */}
          {result && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>
                Varredura concluída! <strong>{result.imported}</strong> criadores autênticos ingeridos e qualificados no CRM.
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
          <form onSubmit={handleStartSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Palavra-chave ou Nicho do Instagram
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ex: humor nordestino, sinuca brasil, futebol varzea, churrasco"
                  required
                  disabled={loading}
                  className="w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                Dica: Digite termos que criadores reais colocam no nome, na bio ou nos vídeos.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Quantidade de Perfis a Extrair
                </label>
                <span className="text-xs font-bold text-blue-500">{count} criadores</span>
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
                <span>25 perfis</span>
                <span>50 perfis</span>
              </div>
            </div>

            {/* Aviso de Ingestão Total & SDR no CRM */}
            <div
              className="p-3 rounded-xl border flex items-center gap-2.5 text-xs"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <div>
                <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                  Ingestão Total 100% Salva no Banco
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Todos os perfis encontrados entram no CRM. A qualificação, detecção de agências e cálculo de ROI são feitos na tabela pelo SDR.
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border rounded-xl text-xs font-medium transition-colors hover:bg-zinc-500/10"
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
                    <span>Varrendo ({elapsedSecs}s)...</span>
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
