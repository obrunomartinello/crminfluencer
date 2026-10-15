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
      bgColor: 'bg-apple-blue/10',
    },
    {
      title: 'Qualificados (Ouro + Prata)',
      value: qualified,
      sub: 'Score ≥ 50',
      icon: Award,
      color: 'text-apple-yellow',
      bgColor: 'bg-apple-yellow/10',
    },
    {
      title: 'WhatsApps Capturados',
      value: whatsapps,
      sub: 'Contato direto',
      icon: Phone,
      color: 'text-apple-green',
      bgColor: 'bg-apple-green/10',
    },
    {
      title: 'Em Negociação',
      value: negotiating,
      sub: 'Abordado / Negociando',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Parcerias Fechadas',
      value: closed,
      sub: 'Contratos ativos',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className="bg-apple-card rounded-2xl p-5 border border-apple-border hover:border-white/15 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-apple-muted uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-semibold tracking-tight text-white mb-1">
                {new Intl.NumberFormat('pt-BR').format(card.value)}
              </div>
              <div className="text-xs text-apple-muted">{card.sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
