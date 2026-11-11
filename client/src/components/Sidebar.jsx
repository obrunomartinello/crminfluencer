import React from 'react'
import {
  LayoutDashboard,
  Columns3,
  Send,
  DollarSign,
  Target,
  FileSpreadsheet,
  Sparkles,
  X,
} from 'lucide-react'

export default function Sidebar({
  currentTab,
  onSelectTab,
  stats = {},
  mobileOpen = false,
  onCloseMobile,
}) {
  const toContactCount = stats?.toContactCount ?? 0
  const sentTotalCount = stats?.sentTotalCount ?? 0

  const mainNav = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'kanban',
      label: 'CRM Kanban',
      icon: Columns3,
      badge: toContactCount > 0 ? { text: `${toContactCount} novos`, tone: 'blue' } : null,
    },
    {
      id: 'sent',
      label: 'Já Mandados',
      icon: Send,
      badge: sentTotalCount > 0 ? { text: String(sentTotalCount), tone: 'neutral' } : null,
    },
  ]

  const opsNav = [
    { id: 'publicidades', label: 'Publicidades', icon: DollarSign },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'importar', label: 'Planilhas', icon: FileSpreadsheet },
  ]

  const renderItem = (item) => {
    const Icon = item.icon
    const active = currentTab === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSelectTab(item.id)
          if (onCloseMobile) onCloseMobile()
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          active
            ? 'bg-white dark:bg-zinc-800 shadow-sm border'
            : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
        }`}
        style={{
          borderColor: active ? 'var(--border-color)' : 'transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span className="flex items-center gap-2.5">
          <Icon size={16} className={active ? 'text-blue-600 dark:text-blue-400' : ''} />
          <span>{item.label}</span>
        </span>

        {item.badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.badge.tone === 'blue'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {item.badge.text}
          </span>
        )}
      </button>
    )
  }

  const content = (
    <div className="flex flex-col h-full p-4 space-y-5">
      {/* Brand + Workspace Card estilo ZapData */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Scout CRM
              </div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                v3.0 • Afiliados
              </div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div
          className="p-2.5 rounded-xl border text-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>
            Operação Pedro (.bet.br)
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            4 jogos • Funil SDR + Publis
          </div>
        </div>
      </div>

      {/* Menu Groups */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Prospecção SDR
          </div>
          {mainNav.map(renderItem)}
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Operação & Dados
          </div>
          {opsNav.map(renderItem)}
        </div>
      </div>

      {/* Mini legenda de status na sidebar */}
      <div
        className="p-3 rounded-xl border text-[11px] space-y-1.5"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)',
        }}
      >
        <div className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Separação Rápida
        </div>
        <div className="flex items-center justify-between">
          <span>Para abordar:</span>
          <strong className="text-blue-600 dark:text-blue-400">{toContactCount}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span>Já mandados:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{sentTotalCount}</strong>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar fixa */}
      <aside
        className="hidden lg:block w-60 shrink-0 border-r min-h-screen sticky top-0 max-h-screen"
        style={{
          backgroundColor: 'var(--bg-card-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside
            className="relative w-64 max-w-[80vw] h-full border-r shadow-2xl z-10"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
