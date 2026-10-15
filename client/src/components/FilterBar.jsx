import React, { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, SlidersHorizontal, RotateCw, ChevronDown } from 'lucide-react'

export default function FilterBar({
  filters,
  onFilterChange,
  onMineClick,
  onRefresh,
  loading,
}) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const debounceRef = useRef(null)

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange('search', val)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div
      className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Buscar criador por @username ou nome..."
          className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs transition-colors"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="appearance-none border text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Status: Todos</option>
            <option value="Novo">Novo</option>
            <option value="Qualificado">Qualificado</option>
            <option value="Abordado">Abordado</option>
            <option value="Negociando">Negociando</option>
            <option value="Fechado">Fechado</option>
            <option value="Desqualificado">Desqualificado</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Classification Dropdown */}
        <div className="relative">
          <select
            value={filters.classification || ''}
            onChange={(e) => onFilterChange('classification', e.target.value)}
            className="appearance-none border text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Classe: Todas</option>
            <option value="OURO">💎 OURO (75-100)</option>
            <option value="PRATA">🥈 PRATA (50-74)</option>
            <option value="BRONZE">🥉 BRONZE (30-49)</option>
            <option value="LIXO">🗑️ LIXO (&lt;30)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Recarregar lista"
          className="p-2 border rounded-xl transition-all disabled:opacity-50"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Minerar Button */}
        <button
          onClick={onMineClick}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Sparkles size={14} />
          <span>Minerar Criadores</span>
        </button>
      </div>
    </div>
  )
}
