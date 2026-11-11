import React from 'react'
import { X } from 'lucide-react'
import BrandLogo from './BrandLogo'

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
      emoji: '📊',
      badge: null,
    },
    {
      id: 'kanban',
      label: 'CRM Kanban',
      emoji: '🎰',
      badge: toContactCount > 0 ? { text: `🎲 ${toContactCount} novos`, tone: 'vegas' } : null,
    },
    {
      id: 'sent',
      label: 'Já Mandados',
      emoji: '🚀',
      badge: sentTotalCount > 0 ? { text: String(sentTotalCount), tone: 'emerald' } : null,
    },
  ]

  const opsNav = [
    { id: 'publicidades', label: 'Publicidades', emoji: '💰' },
    { id: 'metas', label: 'Metas', emoji: '🏆' },
    { id: 'importar', label: 'Planilhas', emoji: '📋' },
  ]

  const renderItem = (item) => {
    const active = currentTab === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSelectTab(item.id)
          if (onCloseMobile) onCloseMobile()
        }}
        className={`casino-hover-spin w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          active
            ? 'bg-gradient-to-r from-emerald-500/12 via-emerald-500/5 to-amber-500/10 dark:from-emerald-500/20 dark:to-amber-500/15 shadow-sm border'
            : 'hover:bg-emerald-500/5 dark:hover:bg-white/5 border border-transparent'
        }`}
        style={{
          borderColor: active ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span className="flex items-center gap-2.5">
          <span className="w-5 text-center text-sm leading-none casino-spin-target select-none" aria-hidden="true">
            {item.emoji}
          </span>
          <span className={active ? 'text-emerald-700 dark:text-emerald-300 font-bold' : ''}>
            {item.label}
          </span>
        </span>

        {item.badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.badge.tone === 'vegas'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
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
      {/* Brand + Workspace Card estilo Casa VIP .bet.br */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 casino-hover-spin cursor-default">
            <div className="rounded-xl shadow-md shadow-emerald-700/25 casino-shimmer shrink-0">
              <BrandLogo size={38} className="casino-spin-target block" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <span>Jackpot CRM</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-extrabold tracking-wide">
                  VIP
                </span>
              </div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Afiliados & Publis .bet.br 🎲
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

        <div className="casino-felt-box p-3 rounded-xl text-xs text-white">
          <div className="font-bold text-[11px] flex items-center justify-between gap-1 text-amber-300">
            <span>🃏 Operação Pedro (.bet.br)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 casino-jackpot-ring shrink-0" />
          </div>
          <div className="text-[10px] mt-0.5 text-emerald-100/80">
            4 jogos • Funil SDR + Publis 💰
          </div>
        </div>
      </div>

      {/* Menu Groups */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <span>🎯 Prospecção SDR</span>
          </div>
          {mainNav.map(renderItem)}
        </div>

        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <span>🪙 Operação & Banca</span>
          </div>
          {opsNav.map(renderItem)}
        </div>
      </div>

      {/* Mini placar da mesa na sidebar */}
      <div
        className="p-3 rounded-xl border text-[11px] space-y-1.5"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)',
        }}
      >
        <div className="font-bold text-[10px] uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          <span>🎲 Placar da Mesa</span>
          <span className="text-emerald-600 dark:text-emerald-400">AO VIVO</span>
        </div>
        <div className="flex items-center justify-between">
          <span>🎯 Para abordar:</span>
          <strong className="text-amber-600 dark:text-amber-400">{toContactCount}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span>🚀 Já mandados:</span>
          <strong className="text-emerald-600 dark:text-emerald-400">{sentTotalCount}</strong>
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
