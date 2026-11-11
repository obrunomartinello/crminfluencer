import React, { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, RotateCw, ChevronDown, ShieldCheck, ArrowUpDown } from 'lucide-react'
import { PEDRO_STATUSES } from '../constants/nichePresets'

export default function FilterBar({
  filters,
  onFilterChange,
  onRefresh,
  loading,
  showStatusFilter = true,
}) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const debounceRef = useRef(null)

  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

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
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Buscar por @, nome, nicho, bio ou termo minerado..."
          className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs transition-colors"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Ordenação */}
        <div className="relative">
          <select
            value={filters.sortBy || 'recent'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="appearance-none border text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            title="Ordenação da tabela"
          >
            <option value="recent">🕒 Mais Recentes</option>
            <option value="score">💎 Maior Score (Ouro)</option>
            <option value="followers">👥 Mais Seguidores</option>
            <option value="views">🎬 Mais Views Reels</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <ArrowUpDown size={13} />
          </div>
        </div>

        {/* Toggle Só Minerados */}
        <button
          type="button"
          onClick={() => onFilterChange('onlyMined', !filters.onlyMined)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            filters.onlyMined
              ? 'bg-blue-500/15 border-blue-500/50 text-blue-600 dark:text-blue-400'
              : 'hover:border-zinc-400 text-zinc-500'
          }`}
          style={{
            backgroundColor: filters.onlyMined ? undefined : 'var(--input-bg)',
            borderColor: filters.onlyMined ? undefined : 'var(--border-color)',
          }}
          title="Filtrar apenas leads descobertos pela mineração"
        >
          <Sparkles size={13} className={filters.onlyMined ? 'text-blue-500' : 'text-zinc-400'} />
          <span>{filters.onlyMined ? 'Só Minerados' : 'Novos / Minerados'}</span>
        </button>

        {/* Filtro de Porte de Seguidores */}
        <div className="relative">
          <select
            value={filters.minFollowers || ''}
            onChange={(e) => onFilterChange('minFollowers', e.target.value)}
            className="appearance-none border text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: filters.minFollowers ? '#3B82F6' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Seguidores: Todos</option>
            <option value="15000">🔥 15k+ (Ideal Pedro)</option>
            <option value="30000">🚀 30k+</option>
            <option value="50000">⭐ 50k+</option>
            <option value="100000">👑 100k+</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Status Dropdown alinhado com os status do Pedro (visível no modo Lista) */}
        {showStatusFilter && (
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="appearance-none border text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: filters.status ? '#3B82F6' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Status: Todos</option>
              {PEDRO_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              <option value="Remarketing">♻️ Remarketing (Grupo)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
              <ChevronDown size={14} />
            </div>
          </div>
        )}

        {/* Classification Dropdown */}
        <div className="relative">
          <select
            value={filters.classification || ''}
            onChange={(e) => onFilterChange('classification', e.target.value)}
            className="appearance-none border text-xs font-medium pl-3 pr-8 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: filters.classification ? '#3B82F6' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Classe: Todas</option>
            <option value="OURO">💎 OURO (80-100)</option>
            <option value="PRATA">🥈 PRATA (65-79)</option>
            <option value="BRONZE">🥉 BRONZE (45-64)</option>
            <option value="LIXO">🗑️ LIXO (&lt;45)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Toggle Anti-Agência */}
        <button
          type="button"
          onClick={() => onFilterChange('hideAgencies', !filters.hideAgencies)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            filters.hideAgencies
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
              : 'hover:border-zinc-400 text-zinc-500'
          }`}
          style={{
            backgroundColor: filters.hideAgencies ? undefined : 'var(--input-bg)',
            borderColor: filters.hideAgencies ? undefined : 'var(--border-color)',
          }}
          title={filters.hideAgencies ? 'Mostrando apenas criadores diretos' : 'Clique para ocultar perfis com agência'}
        >
          <ShieldCheck size={14} className={filters.hideAgencies ? 'text-emerald-500' : 'text-zinc-400'} />
          <span>{filters.hideAgencies ? 'Sem Agência' : 'Ocultar Agências'}</span>
        </button>

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
      </div>
    </div>
  )
}
