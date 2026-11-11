import React from 'react'
import {
  Users,
  Send,
  MessageSquare,
  CheckCircle2,
  Phone,
  TrendingUp,
  DollarSign,
  Award,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Layers,
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
      badge: `${totalPct(toContactCount)}% da base`,
      badgeTone: toContactCount > 0 ? 'amber' : 'neutral',
      sub: toContactCount > 0 ? 'Prontos para 1ª mensagem' : 'Fila zerada — clique em Minerar',
      icon: Users,
      onClick: () => onNavigateTab('kanban', { status: 'Novo' }),
    },
    {
      title: 'Já Mandados (Aguardando)',
      value: formatNum(sentWaitingCount),
      badge: `${formatNum(sentTotalCount)} enviados`,
      badgeTone: 'blue',
      sub: 'Msg Enviada / Sem resposta',
      icon: Send,
      onClick: () => onNavigateTab('sent', { status: 'Aguardando' }),
    },
    {
      title: 'Em Negociação',
      value: formatNum(negotiating),
      badge: 'Funil ativo',
      badgeTone: 'purple',
      sub: 'Pedindo métricas / fechando valor',
      icon: MessageSquare,
      onClick: () => onNavigateTab('kanban', { status: 'Em negociação' }),
    },
    {
      title: 'Parcerias Fechadas',
      value: formatNum(closed),
      badge: `${conversionRate}% conv.`,
      badgeTone: 'emerald',
      sub: 'Criadores prontos p/ publi',
      icon: CheckCircle2,
      onClick: () => onNavigateTab('kanban', { status: 'Fechou' }),
    },
    {
      title: 'Prontos c/ WhatsApp',
      value: formatNum(whatsapps),
      badge: `${waPct}% com tel.`,
      badgeTone: 'emerald',
      sub: `${formatNum(qualified)} Ouro/Prata na base`,
      icon: Phone,
      onClick: () => onNavigateTab('kanban'),
    },
    {
      title: 'Taxa de Resposta',
      value: `${responseRate}%`,
      badge: `${formatNum(repliedCount)} resp.`,
      badgeTone: responseRate >= 30 ? 'emerald' : 'neutral',
      sub: `Retorno sobre ${formatNum(sentTotalCount)} abordados`,
      icon: TrendingUp,
      onClick: () => onNavigateTab('sent'),
    },
    {
      title: 'Investido em Publis',
      value: formatBRL(publicidadesSummary?.totalInvested || 0),
      badge: `${publicidadesSummary?.totalAds || 0} publis`,
      badgeTone: 'neutral',
      sub: 'Total pago + comissões',
      icon: DollarSign,
      onClick: () => onNavigateTab('publicidades'),
    },
    {
      title: 'Lucro / Retorno',
      value: formatBRL(publicidadesSummary?.netProfit || 0),
      badge: roiLabel,
      badgeTone: (publicidadesSummary?.netProfit || 0) >= 0 ? 'emerald' : 'red',
      sub: `Retorno bruto: ${formatBRL(publicidadesSummary?.totalReturn || 0)}`,
      icon: Award,
      onClick: () => onNavigateTab('publicidades'),
    },
  ]

  const badgeToneClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20',
  }

  const funnelStages = [
    {
      label: '1. Para Abordar (Novos)',
      count: toContactCount,
      color: 'bg-sky-500',
      onClick: () => onNavigateTab('kanban', { status: 'Novo' }),
    },
    {
      label: '2. Msg Enviada / Aguardando',
      count: sentWaitingCount,
      color: 'bg-blue-600',
      onClick: () => onNavigateTab('sent', { status: 'Aguardando' }),
    },
    {
      label: '3. Em Negociação',
      count: negotiating,
      color: 'bg-purple-500',
      onClick: () => onNavigateTab('kanban', { status: 'Em negociação' }),
    },
    {
      label: '4. Parcerias Fechadas',
      count: closed,
      color: 'bg-emerald-500',
      onClick: () => onNavigateTab('kanban', { status: 'Fechou' }),
    },
    {
      label: '5. Remarketing / Recusados',
      count: remarketingCount,
      color: 'bg-amber-500',
      onClick: () => onNavigateTab('sent', { status: 'Recusados' }),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Barra superior estilo ZapData */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleOnlyMined && onToggleOnlyMined(false)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !onlyMinedFilter
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                : 'border-transparent hover:bg-zinc-500/10'
            }`}
            style={{ color: !onlyMinedFilter ? undefined : 'var(--text-muted)' }}
          >
            Visão Geral SDR
          </button>

          <button
            type="button"
            onClick={() => {
              if (onToggleOnlyMined) onToggleOnlyMined(true)
              onNavigateTab('kanban', { onlyMined: true })
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              onlyMinedFilter
                ? 'bg-blue-600 text-white border-transparent shadow-sm'
                : 'hover:bg-zinc-500/10'
            }`}
            style={{
              backgroundColor: onlyMinedFilter ? undefined : 'var(--bg-card)',
              borderColor: onlyMinedFilter ? undefined : 'var(--border-color)',
              color: onlyMinedFilter ? undefined : 'var(--text-muted)',
            }}
          >
            <Sparkles size={12} />
            <span>Ver Só Minerados</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('kanban')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:border-blue-500/50"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <Layers size={13} className="text-blue-500" />
            <span>Abrir CRM Kanban</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sent')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:border-emerald-500/50"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <Send size={13} className="text-emerald-500" />
            <span>Ver Já Mandados ({sentTotalCount})</span>
          </button>

          <button
            type="button"
            onClick={onMineClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles size={13} />
            <span>Minerar Novos</span>
          </button>
        </div>
      </div>

      {/* Grade 4x2 estilo ZapData (Cards clicáveis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          const toneClass = badgeToneClasses[card.badgeTone] || badgeToneClasses.neutral
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className="text-left rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors group-hover:border-blue-500/40"
                  style={{
                    backgroundColor: 'var(--bg-card-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Icon size={16} />
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${toneClass}`}>
                  {card.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  {card.title}
                </div>
                <div className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  {card.value}
                </div>
                <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>{card.sub}</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
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
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Funil de Captação & Envios
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Distribuição dos {formatNum(total)} criadores entre fila nova e já mandados
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('kanban')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver no Kanban
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
                    <span className="font-medium group-hover:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
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
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Guia Operacional — O Que Fazer Agora
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Siga esta ordem para prospectar sem misturar novos com já mandados
            </p>
          </div>

          <div className="space-y-2.5">
            <div
              className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
              style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {toContactCount > 0
                      ? `${formatNum(toContactCount)} leads novos esperando 1ª abordagem`
                      : 'Nenhum lead novo na fila de prospecção'}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {toContactCount > 0
                      ? 'Mande WhatsApp/DM e clique em "Já Mandei Msg" no card.'
                      : 'Use o botão Minerar para puxar criadores do Instagram.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toContactCount > 0 ? () => onNavigateTab('kanban') : onMineClick}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold whitespace-nowrap shrink-0"
              >
                {toContactCount > 0 ? 'Abrir Fila' : 'Minerar'}
              </button>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
              style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatNum(sentWaitingCount)} leads já mandados aguardando retorno
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Confira quem já recebeu msg e cobre follow-up em 1 clique.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('sent')}
                className="px-3 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap shrink-0 hover:border-emerald-500/50"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Já Mandados
              </button>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
              style={{ backgroundColor: 'var(--bg-card-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    <span>{formatNum(missingDataCount)} leads com WhatsApp ou Views faltando</span>
                    {missingDataCount > 0 && <AlertCircle size={12} className="text-amber-500" />}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Clique em "Preencher Ficha" no card para atualizar número e métricas.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('kanban')}
                className="px-3 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap shrink-0 hover:border-amber-500/50"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Completar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
