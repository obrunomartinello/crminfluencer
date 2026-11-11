import React from 'react'
import { Flame, RefreshCw, AlertTriangle, CheckCircle2, Thermometer } from 'lucide-react'

const LEVEL_STYLES = {
  healthy: {
    pillBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    bar: 'from-emerald-500 to-teal-400',
    badge: 'bg-emerald-500/15 text-emerald-500',
    accentText: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  warning: {
    pillBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    bar: 'from-amber-500 to-orange-400',
    badge: 'bg-amber-500/15 text-amber-500',
    accentText: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  critical: {
    pillBg: 'bg-red-500/10 border-red-500/30 text-red-500',
    bar: 'from-red-600 to-rose-400',
    badge: 'bg-red-500/15 text-red-500',
    accentText: 'text-red-500',
    dot: 'bg-red-500',
  },
}

function formatUsd(val) {
  const num = Number(val || 0)
  return `$${num.toFixed(2)}`
}

function formatResetDate(iso) {
  if (!iso) return { label: 'Ciclo mensal', daysLeft: null }
  const end = new Date(iso)
  if (Number.isNaN(end.getTime())) return { label: 'Ciclo mensal', daysLeft: null }
  const diffDays = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const formatted = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return { label: formatted, daysLeft: diffDays }
}

export default function ApifyThermometer({
  quota,
  loading = false,
  onRefresh,
  onClick,
  variant = 'detailed',
}) {
  if (!quota && !loading) return null

  const configured = quota?.configured !== false
  const level = quota?.level || 'healthy'
  const theme = LEVEL_STYLES[level] || LEVEL_STYLES.healthy
  const percentRemaining = Math.max(0, Math.min(100, Number(quota?.percentRemaining ?? 100)))
  const percentUsed = Math.max(0, Math.min(100, Number(quota?.percentUsed ?? 0)))
  const { label: resetLabel, daysLeft } = formatResetDate(quota?.cycleEndAt)

  if (variant === 'compact') {
    if (!quota && loading) {
      return (
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border animate-pulse"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <Thermometer size={11} />
          <span>Apify...</span>
        </div>
      )
    }

    if (!configured) {
      return (
        <span
          title="APIFY_TOKEN não configurado — rodando em modo demonstração"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-zinc-500/10 border-zinc-500/30 text-zinc-400"
        >
          <Thermometer size={11} />
          <span>Apify Mock</span>
        </span>
      )
    }

    return (
      <button
        type="button"
        onClick={onClick || (() => onRefresh && onRefresh(true))}
        title={`Créditos Gratuitos Apify (${quota.plan || 'FREE'}): ${formatUsd(quota.remainingUsd)} livres de ${formatUsd(quota.limitUsd)} (${percentRemaining}% restante • ~${quota.estimatedSearchesLeft} buscas). Renova em ${resetLabel}. Clique para abrir/atualizar.`}
        className={`hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all hover:brightness-110 active:scale-95 ${theme.pillBg}`}
      >
        <Thermometer size={12} className={loading ? 'animate-spin' : ''} />
        <span>
          Apify {formatUsd(quota.remainingUsd)} / {formatUsd(quota.limitUsd)}
        </span>
        <span className="w-10 h-1.5 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
          <span
            className={`block h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-500`}
            style={{ width: `${percentRemaining}%` }}
          />
        </span>
        <span className="opacity-85 hidden xl:inline">~{quota.estimatedSearchesLeft}b</span>
      </button>
    )
  }

  // Detailed card inside MineModal
  return (
    <div
      className="p-3.5 rounded-xl border transition-colors"
      style={{
        backgroundColor: 'var(--bg-card-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme.badge}`}>
            <Thermometer size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Termômetro de Créditos Apify
              </span>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${theme.badge}`}>
                {configured ? `${quota?.plan || 'FREE'} • ${formatUsd(quota?.limitUsd)}/mês` : 'MOCK'}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {configured
                ? `Saldo gratuito em tempo real${quota?.username ? ` (@${quota.username})` : ''}`
                : 'APIFY_TOKEN não configurado neste ambiente'}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={() => onRefresh(true)}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors hover:bg-zinc-500/10 disabled:opacity-50"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
            title="Atualizar saldo direto da Apify"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        )}
      </div>

      {configured && quota && (
        <>
          {/* Thermometer visual bar showing remaining free credit */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-bold flex items-center gap-1 ${theme.accentText}`}>
                {level === 'critical' ? (
                  <AlertTriangle size={12} />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                <span>{formatUsd(quota.remainingUsd)} livres ({percentRemaining}%)</span>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Gastos no ciclo: <strong style={{ color: 'var(--text-primary)' }}>{formatUsd(quota.usedUsd)}</strong> ({percentUsed}%)
              </span>
            </div>

            <div
              className="relative w-full h-3 rounded-full overflow-hidden border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.bar} transition-all duration-700`}
                style={{ width: `${percentRemaining}%` }}
              />
            </div>
          </div>

          {/* Breakdown stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                Restam p/ Gastar
              </p>
              <p className={`text-xs font-bold mt-0.5 ${theme.accentText}`}>
                {formatUsd(quota.remainingUsd)}
              </p>
            </div>

            <div
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                Buscas Restantes
              </p>
              <p className="text-xs font-bold mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text-primary)' }}>
                <Flame size={11} className="text-amber-500" />
                <span>~{quota.estimatedSearchesLeft}</span>
              </p>
            </div>

            <div
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                Renova Cota
              </p>
              <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {resetLabel}
                {daysLeft !== null && (
                  <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                    ({daysLeft}d)
                  </span>
                )}
              </p>
            </div>
          </div>

          {level !== 'healthy' && (
            <p className={`mt-2 text-[10px] font-medium flex items-center gap-1 ${theme.accentText}`}>
              <AlertTriangle size={11} />
              <span>
                {level === 'critical'
                  ? 'Cota gratuita quase no fim! Reduza o número de perfis por busca ou aguarde a renovação.'
                  : 'Cota abaixo de 40% — deixe o filtro de pular repetidos ativado para economizar créditos.'}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
