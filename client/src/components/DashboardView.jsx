/**
 * @pilar PILAR 5 — Infraestrutura, Keepalive, Planilhas & Visual Jackpot
 */
import React from 'react'
import {
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function formatNum(val) {
  return new Intl.NumberFormat('pt-BR').format(val || 0)
}

export default function DashboardView({
  stats = {},
  onNavigateTab,
  onMineClick,
  onlyMinedFilter = false,
  onToggleOnlyMined,
}) {
  const {
    total = 0,
    qualified = 0,
    whatsapps = 0,
    closed = 0,
    negotiating = 0,
    conversionRate = 0,
    toContactCount = 0,
    sentWaitingCount = 0,
    sentTotalCount = 0,
    repliedCount = 0,
    responseRate = 0,
    missingDataCount = 0,
    statusCounts = {},
    publicidadesSummary = {},
  } = stats

  const totalPct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const waPct = totalPct(whatsapps)
  const netProfit = publicidadesSummary?.netProfit || 0
  const roiVal = publicidadesSummary?.overallRoi
  const roiLabel = roiVal !== null && roiVal !== undefined ? `${roiVal >= 0 ? '+' : ''}${(roiVal * 100).toFixed(0)}% ROI` : 'Sem ROI'
  const remarketingCount =
    (statusCounts['Recusado - Remarketing'] || 0) +
    (statusCounts['Outro momento'] || 0) +
    (statusCounts['Não interessado'] || 0) +
    (statusCounts['Recusado - métricas ruins'] || 0)

  const cards = [
    {
      title: 'Falta Abordar (Novos)',
      value: formatNum(toContactCount),
      badge: `🎲 ${totalPct(toContactCount)}% da base`,
      badgeTone: toContactCount > 0 ? 'amber' : 'neutral',
      sub: toContactCount > 0 ? 'Prontos para 1ª mensagem' : 'Fila zerada — clique em Minerar',
      emoji: '🎯',
      iconBg: 'bg-amber-500/12 border-amber-500/30',
      onClick: () => onNavigateTab('kanban', { status: 'Novo' }),
    },
    {
      title: 'Já Mandados (Aguardando)',
      value: formatNum(sentWaitingCount),
      badge: `📩 ${formatNum(sentTotalCount)} envios`,
      badgeTone: 'indigo',
      sub: 'Msg Enviada / Sem resposta',
      emoji: '🚀',
      iconBg: 'bg-indigo-500/12 border-indigo-500/30',
      onClick: () => onNavigateTab('sent', { status: 'Aguardando' }),
    },
    {
      title: 'Em Negociação',
      value: formatNum(negotiating),
      badge: '🔥 Mesa ativa',
      badgeTone: 'purple',
      sub: 'Pedindo métricas / fechando valor',
      emoji: '🃏',
      iconBg: 'bg-purple-500/12 border-purple-500/30',
      onClick: () => onNavigateTab('kanban', { status: 'Em negociação' }),
    },
    {
      title: 'Parcerias Fechadas',
      value: formatNum(closed),
      badge: closed > 0 ? `💎 ${conversionRate}% Jackpot` : `${conversionRate}% conv.`,
      badgeTone: 'emerald',
      sub: 'Criadores prontos p/ publi',
      emoji: '🏆',
      iconBg: 'bg-emerald-500/15 border-emerald-500/35',
      jackpot: closed > 0,
      onClick: () => onNavigateTab('kanban', { status: 'Fechou' }),
    },
    {
      title: 'Prontos c/ WhatsApp',
      value: formatNum(whatsapps),
      badge: `📱 ${waPct}% com tel.`,
      badgeTone: 'emerald',
      sub: `${formatNum(qualified)} Ouro/Prata na base`,
      emoji: '📲',
      iconBg: 'bg-teal-500/12 border-teal-500/30',
      onClick: () => onNavigateTab('kanban'),
    },
    {
      title: 'Taxa de Resposta',
      value: `${responseRate}%`,
      badge: `🎲 ${formatNum(repliedCount)} resp.`,
      badgeTone: responseRate >= 30 ? 'emerald' : 'amber',
      sub: `Retorno sobre ${formatNum(sentTotalCount)} abordados`,
      emoji: '🎲',
      iconBg: 'bg-sky-500/12 border-sky-500/30',
      onClick: () => onNavigateTab('sent'),
    },
    {
      title: 'Investido em Publis',
      value: formatBRL(publicidadesSummary?.totalInvested || 0),
      badge: `🪙 ${publicidadesSummary?.totalAds || 0} publis`,
      badgeTone: 'amber',
      sub: 'Total pago + comissões',
      emoji: '🪙',
      iconBg: 'bg-amber-500/12 border-amber-500/30',
      onClick: () => onNavigateTab('publicidades'),
    },
    {
      title: 'Lucro / Retorno',
      value: formatBRL(netProfit),
      badge: netProfit > 0 ? `🚀 ${roiLabel}` : roiLabel,
      badgeTone: netProfit >= 0 ? 'emerald' : 'red',
      sub: `Retorno bruto: ${formatBRL(publicidadesSummary?.totalReturn || 0)}`,
      emoji: netProfit >= 0 ? '💰' : '♦️',
      iconBg: netProfit >= 0 ? 'bg-emerald-500/15 border-emerald-500/35' : 'bg-rose-500/12 border-rose-500/30',
      jackpot: netProfit > 0,
      onClick: () => onNavigateTab('publicidades'),
    },
  ]

  const badgeToneClasses = {
    emerald: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25',
    indigo: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-400 border-indigo-500/25',
    purple: 'bg-purple-500/12 text-purple-700 dark:text-purple-400 border-purple-500/25',
    red: 'bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/25',
    neutral: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20',
  }

  const funnelStages = [
    {
      label: '🎯 1. Para Abordar (Novos)',
      count: toContactCount,
      color: 'bg-gradient-to-r from-amber-500 to-orange-500',
      onClick: () => onNavigateTab('kanban', { status: 'Novo' }),
    },
    {
      label: '🚀 2. Msg Enviada / Aguardando',
      count: sentWaitingCount,
      color: 'bg-gradient-to-r from-indigo-600 to-violet-500',
      onClick: () => onNavigateTab('sent', { status: 'Aguardando' }),
    },
    {
      label: '🃏 3. Em Negociação',
      count: negotiating,
      color: 'bg-gradient-to-r from-purple-600 to-fuchsia-500',
      onClick: () => onNavigateTab('kanban', { status: 'Em negociação' }),
    },
    {
      label: '🏆 4. Parcerias Fechadas (Jackpot)',
      count: closed,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      onClick: () => onNavigateTab('kanban', { status: 'Fechou' }),
    },
    {
      label: '♻️ 5. Remarketing / Recusados',
      count: remarketingCount,
      color: 'bg-gradient-to-r from-rose-500 to-amber-500',
      onClick: () => onNavigateTab('sent', { status: 'Recusados' }),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Barra superior estilo Casa VIP / ZapData */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleOnlyMined && onToggleOnlyMined(false)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              !onlyMinedFilter
                ? 'bg-emerald-950 text-amber-300 dark:bg-emerald-500 dark:text-emerald-950 border-amber-500/40 shadow-sm'
                : 'border-transparent hover:bg-emerald-500/10'
            }`}
            style={{ color: !onlyMinedFilter ? undefined : 'var(--text-muted)' }}
          >
            <span>🎰</span>
            <span>Visão Geral SDR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onToggleOnlyMined) onToggleOnlyMined(false)
              onNavigateTab('mined')
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 hover:bg-amber-500/10 hover:border-amber-500/30"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <span>💎</span>
            <span>Ver Minerados ({stats?.minedCount ?? 0})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('kanban')}
            className="casino-hover-spin inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:border-emerald-500/50"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="casino-spin-target">🃏</span>
            <span>Abrir CRM Kanban</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sent')}
            className="casino-hover-spin inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:border-indigo-500/50"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="casino-spin-target">🚀</span>
            <span>Ver Já Mandados ({sentTotalCount})</span>
          </button>

          <button
            type="button"
            onClick={onMineClick}
            className="casino-btn-vegas casino-shimmer casino-hover-spin inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95"
          >
            <span className="casino-spin-target">🎰</span>
            <span>Minerar Novos</span>
          </button>
        </div>
      </div>

      {/* Grade 4x2 estilo ZapData + Cassino (Cards clicáveis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const toneClass = badgeToneClasses[card.badgeTone] || badgeToneClasses.neutral
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: card.jackpot ? 'rgba(16, 185, 129, 0.45)' : 'var(--border-color)',
                animationDelay: `${idx * 40}ms`,
              }}
              className={`casino-card-enter casino-hover-spin text-left rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between group ${
                card.jackpot ? 'casino-jackpot-ring' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-transform group-hover:scale-110 ${card.iconBg}`}
                >
                  <span className="casino-spin-target select-none" aria-hidden="true">
                    {card.emoji}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${toneClass}`}>
                  {card.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  {card.title}
                </div>
                <div className="text-2xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  {card.value}
                </div>
                <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>{card.sub}</span>
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 2 Painéis Analíticos Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Esquerda: Funil de Captação & Envios */}
        <div
          className="rounded-2xl p-5 border space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <span>🎰</span>
                <span>Funil da Mesa & Envios</span>
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Distribuição dos {formatNum(total)} criadores entre fila nova e já mandados
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('kanban')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Ver no Kanban →
            </button>
          </div>

          <div className="space-y-3">
            {funnelStages.map((stage) => {
              const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0
              return (
                <button
                  key={stage.label}
                  type="button"
                  onClick={stage.onClick}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {stage.label}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatNum(stage.count)}</strong> ({pct}%)
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-card-secondary)' }}
                  >
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, stage.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Direita: Guia Rápido "O Que Fazer Agora" */}
        <div
          className="rounded-2xl p-5 border flex flex-col justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>🎲</span>
              <span>Guia da Mesa — O Que Fazer Agora</span>
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Siga a ordem das fichas para prospectar sem misturar novos com já mandados
            </p>
          </div>

          <div className="space-y-2.5">
            <div
              className="p-3.5 rounded-xl border flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
              style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                  1
                </span>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {toContactCount > 0
                      ? `🎯 ${formatNum(toContactCount)} leads novos esperando 1ª abordagem`
                      : '🎰 Fila zerada! Hora de girar a roleta de leads'}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {toContactCount > 0
                      ? 'Mande WhatsApp/DM e clique em "🚀 Já Mandei Msg" no card.'
                      : 'Use o botão 🎰 Minerar para puxar criadores inéditos do Instagram.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toContactCount > 0 ? () => onNavigateTab('kanban') : onMineClick}
                className="casino-btn-vegas px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0"
              >
                {toContactCount > 0 ? 'Abrir Fila 🃏' : 'Minerar 🎰'}
              </button>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
              style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                  2
                </span>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    🚀 {formatNum(sentWaitingCount)} leads já mandados aguardando retorno
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Confira quem já recebeu msg e cobre follow-up em 1 clique.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('sent')}
                className="px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap shrink-0 hover:border-emerald-500/50 transition-colors"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Já Mandados 🚀
              </button>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
              style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                  3
                </span>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    <span>🃏 {formatNum(missingDataCount)} fichas com WhatsApp ou Views faltando</span>
                    {missingDataCount > 0 && <AlertCircle size={12} className="text-amber-500" />}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Clique em "📋 Ficha" no card para atualizar número, game e cachê.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('kanban')}
                className="px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap shrink-0 hover:border-amber-500/50 transition-colors"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Completar 🪙
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
