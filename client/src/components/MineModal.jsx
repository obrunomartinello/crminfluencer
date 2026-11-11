import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  Zap,
  Radio,
  Flame,
  UserSearch,
  Layers,
} from 'lucide-react'
import { NICHE_PRESETS } from '../constants/nichePresets'
import { api } from '../lib/api'

const SEARCH_MODES = [
  {
    id: 'hybrid',
    label: 'Híbrido (Recomendado)',
    icon: Layers,
    hint: 'Reels virais + Perfis ao vivo no Instagram',
  },
  {
    id: 'popular',
    label: 'Reels Virais',
    icon: Flame,
    hint: 'Criadores em alta produzindo vídeos do nicho',
  },
  {
    id: 'user',
    label: 'Perfis Diretos',
    icon: UserSearch,
    hint: 'Busca exata por nome e @ no Instagram',
  },
]

export default function MineModal({ open, onClose, onComplete }) {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(20)
  const [mode, setMode] = useState('hybrid')
  const [skipExisting, setSkipExisting] = useState(true)
  const [activeNicheId, setActiveNicheId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stageInfo, setStageInfo] = useState({ stage: 1, label: '' })
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const pollingRef = useRef(null)
  const timerRef = useRef(null)
  const currentJobIdRef = useRef(null)

  const stopTimers = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    pollingRef.current = null
    timerRef.current = null
  }

  useEffect(() => {
    return () => stopTimers()
  }, [])

  if (!open) return null

  const activePreset = NICHE_PRESETS.find((p) => p.id === activeNicheId)

  const handleSelectNiche = (preset) => {
    setActiveNicheId(preset.id)
    const keywords = preset.defaultKeywords
    const nextIdx = keywords.indexOf(query) !== -1
      ? (keywords.indexOf(query) + 1) % keywords.length
      : 0
    setQuery(keywords[nextIdx])
  }

  const handleStartSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    stopTimers()
    setLoading(true)
    setError(null)
    setResult(null)
    setElapsedSecs(0)
    setStageInfo({ stage: 1, label: 'Iniciando varredura no Instagram...' })

    try {
      const startRes = await api.startMine(query.trim(), count, mode, skipExisting)
      currentJobIdRef.current = startRes.jobId

      if (startRes.status === 'COMPLETED') {
        setResult({
          imported: startRes.imported || 0,
          newCount: startRes.newCount || 0,
          updatedCount: startRes.updatedCount || 0,
          items: startRes.items || [],
          message: startRes.message,
        })
        setLoading(false)
        if (onComplete) onComplete(startRes.items || [], startRes)
        return
      }

      if (startRes.stageLabel) {
        setStageInfo({ stage: startRes.stage || 1, label: startRes.stageLabel })
      }

      timerRef.current = setInterval(() => {
        setElapsedSecs((prev) => prev + 1)
      }, 1000)

      pollingRef.current = setInterval(async () => {
        try {
          if (!currentJobIdRef.current) return
          const statusRes = await api.getMineStatus(currentJobIdRef.current)

          // Se avançou da Fase 1 (Descoberta) para Fase 2 (Enriquecimento de Perfil)
          if (statusRes.nextJobId) {
            currentJobIdRef.current = statusRes.nextJobId
          }

          if (statusRes.status === 'RUNNING') {
            setStageInfo({
              stage: statusRes.stage || 1,
              label: statusRes.stageLabel || 'Processando criadores...',
            })
            return
          }

          if (statusRes.status === 'COMPLETED') {
            stopTimers()
            setResult({
              imported: statusRes.imported || 0,
              newCount: statusRes.newCount || 0,
              updatedCount: statusRes.updatedCount || 0,
              items: statusRes.items || [],
              message: statusRes.message,
            })
            setLoading(false)
            if (onComplete) onComplete(statusRes.items || [], statusRes)
          } else if (statusRes.status === 'FAILED') {
            stopTimers()
            setError(statusRes.error || 'A varredura da Apify falhou. Tente outro termo.')
            setLoading(false)
          }
        } catch (pollErr) {
          console.warn('[mine] Erro no polling de status:', pollErr.message)
        }
      }, 2500)
    } catch (err) {
      stopTimers()
      setError(err.message || 'Erro ao iniciar varredura')
      setLoading(false)
    }
  }

  const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n || 0)

  const handleClose = () => {
    if (loading) return
    stopTimers()
    setResult(null)
    setError(null)
    onClose()
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
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-zinc-500/10 disabled:opacity-30"
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
              Motor de Descoberta de Criadores v2.1
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Busca em 2 fases: descobre Reels/perfis ao vivo e extrai seguidores, bio e WhatsApp
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
                <Zap size={11} /> Clique p/ selecionar termo
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

            {/* Variações de Palavras-Chave do Nicho Selecionado */}
            {activePreset && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {activePreset.defaultKeywords.map((kw) => {
                  const active = query === kw
                  return (
                    <button
                      key={kw}
                      type="button"
                      disabled={loading}
                      onClick={() => setQuery(kw)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        active
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'hover:border-blue-400'
                      }`}
                      style={
                        !active
                          ? {
                              backgroundColor: 'var(--bg-card-secondary)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)',
                            }
                          : undefined
                      }
                    >
                      #{kw}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status / Loading Progress Card */}
          {loading && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                  <Radio size={14} className="animate-spin" />
                  <span>
                    Fase {stageInfo.stage}/2 — Varredura Apify ({elapsedSecs}s)
                  </span>
                </div>
                <span className="text-[10px] text-blue-500 font-semibold">
                  {stageInfo.stage === 1 ? 'Descoberta' : 'Enriquecimento'}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {stageInfo.label || `Buscando criadores para "${query}"...`}
              </p>
              <div className="w-full h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{
                    width: stageInfo.stage === 1
                      ? `${Math.min(15 + elapsedSecs * 4, 48)}%`
                      : `${Math.min(52 + elapsedSecs * 2, 95)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Rich Results Card */}
          {result && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <div>
                  {result.message ? (
                    <span>{result.message}</span>
                  ) : (
                    <span>
                      Varredura concluída! <strong>{result.newCount}</strong> novos criadores descobertos
                      {result.updatedCount > 0 ? ` (+${result.updatedCount} atualizados)` : ''} e colocados no topo da tabela.
                    </span>
                  )}
                </div>
              </div>

              {result.items && result.items.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {result.items.slice(0, 8).map((c) => (
                    <div
                      key={c.username}
                      className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          @{c.username}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {formatNum(c.followers_count)} seg • {formatNum(c.avg_reels_views)} views
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        {c.classification} ({c.score})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  Ver Criadores na Tabela →
                </button>
              </div>
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
            {/* Seletor de Estratégia de Busca */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Modo de Descoberta
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SEARCH_MODES.map((m) => {
                  const Icon = m.icon
                  const selected = mode === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={loading}
                      onClick={() => setMode(m.id)}
                      className="p-2 rounded-xl border text-left transition-all"
                      style={{
                        backgroundColor: selected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card-secondary)',
                        borderColor: selected ? '#3B82F6' : 'var(--border-color)',
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <Icon size={12} className={selected ? 'text-blue-500' : 'text-zinc-400'} />
                        <span className="truncate">{m.label}</span>
                      </div>
                      <p className="text-[9px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {m.hint}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

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
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Quantidade de Perfis a Extrair
                </label>
                <span className="text-xs font-bold text-blue-500">até {count} criadores</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={loading}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>5 perfis (rápido)</span>
                <span>20 perfis</span>
                <span>40 perfis (profundo)</span>
              </div>
            </div>

            {/* Checkbox anti-repetição */}
            <label
              className="p-3 rounded-xl border flex items-center gap-2.5 text-xs cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                disabled={loading}
                className="accent-emerald-600 w-4 h-4 rounded"
              />
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <div>
                <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                  Priorizar Perfis Inéditos (Evitar Repetição)
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Pula @s que já estão no CRM e gasta créditos da Apify apenas nos criadores novos.
                </div>
              </div>
            </label>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border rounded-xl text-xs font-medium transition-colors hover:bg-zinc-500/10 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {result ? 'Fechar' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Fase {stageInfo.stage}/2 ({elapsedSecs}s)...</span>
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
