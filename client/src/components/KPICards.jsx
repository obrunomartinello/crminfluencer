import React from 'react'
import { Users, Award, Phone, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function KPICards({ stats = {} }) {
  const {
    total = 0,
    qualified = 0,
    whatsapps = 0,
    negotiating = 0,
    closed = 0,
  } = stats

  const cards = [
    {
      title: 'Total Minerados',
      value: total,
      sub: 'Perfis no banco',
      icon: Users,
      color: 'text-apple-blue',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
    },
    {
      title: 'Qualificados (Ouro + Prata)',
      value: qualified,
      sub: 'Score ≥ 50',
      icon: Award,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
    },
    {
      title: 'WhatsApps Capturados',
      value: whatsapps,
      sub: 'Contato direto',
      icon: Phone,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    {
      title: 'Em Negociação',
      value: negotiating,
      sub: 'Abordado / Negociando',
      icon: TrendingUp,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
    },
    {
      title: 'Parcerias Fechadas',
      value: closed,
      sub: 'Contratos ativos',
      icon: CheckCircle2,
      color: 'text-teal-500 dark:text-teal-400',
      bgColor: 'bg-teal-500/10 dark:bg-teal-500/15',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className="rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
            </div>
            <div>
              <div
                className="text-3xl font-bold tracking-tight mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {new Intl.NumberFormat('pt-BR').format(card.value)}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {card.sub}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
