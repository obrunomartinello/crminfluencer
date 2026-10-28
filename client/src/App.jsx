import React, { useState, useEffect, useCallback } from 'react'
import { api } from './lib/api'
import KPICards from './components/KPICards'
import FilterBar from './components/FilterBar'
import InfluencerTable from './components/InfluencerTable'
import InfluencerDrawer from './components/InfluencerDrawer'
import MineModal from './components/MineModal'
import CreateLeadModal from './components/CreateLeadModal'
import { Sparkles, Sun, Moon, AlertCircle, ShieldCheck, UserPlus } from 'lucide-react'

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('scout_theme') || 'dark'
  })

  const [influencers, setInfluencers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    whatsapps: 0,
    negotiating: 0,
    closed: 0,
  })
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    classification: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedInfluencer, setSelectedInfluencer] = useState(null)
  const [mineModalOpen, setMineModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Gerenciamento de Tema (Dark / Light)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('scout_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Carregar dados de estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats()
      if (data) setStats(data)
    } catch (err) {
      console.warn('Erro ao carregar stats:', err.message)
    }
  }, [])

  // Carregar lista de influenciadores com filtros
  const fetchInfluencers = useCallback(async (customPage = page, customFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getInfluencers({
        ...customFilters,
        page: customPage,
        limit: 15,
      })
      setInfluencers(res.data || [])
      setTotal(res.total || 0)
      setPage(res.page || 1)
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      setError(err.message || 'Falha ao conectar ao servidor do CRM.')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  // Efeito inicial
  useEffect(() => {
    fetchStats()
    fetchInfluencers(1, filters)
  }, [])

  // Atualização de filtro
  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    setPage(1)
    fetchInfluencers(1, updated)
  }

  // Mudança de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      fetchInfluencers(newPage, filters)
    }
  }

  // Mudança inline de status na tabela
  const handleStatusChange = async (id, newStatus) => {
    setInfluencers((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    )

    if (selectedInfluencer && selectedInfluencer.id === id) {
      setSelectedInfluencer((prev) => ({ ...prev, status: newStatus }))
    }

    try {
      await api.updateInfluencer(id, { status: newStatus })
      fetchStats()
    } catch (err) {
      console.error('Erro ao atualizar status:', err.message)
      fetchInfluencers(page, filters)
    }
  }

  // Atualização a partir do Drawer (notas, telefone, calculadora de ROI)
  const handleDrawerUpdate = async (id, data) => {
    try {
      const res = await api.updateInfluencer(id, data)
      const updated = res.data || { ...selectedInfluencer, ...data }

      setSelectedInfluencer(updated)
      setInfluencers((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
      )
      fetchStats()
    } catch (err) {
      console.error('Erro ao atualizar influenciador:', err.message)
    }
  }

  // Ação de mineração
  const handleMine = async (query, count) => {
    const res = await api.mine(query, count)
    await fetchStats()
    await fetchInfluencers(1, filters)
    return res
  }

  // Cadastro Manual de Criador / Parceiro
  const handleCreateLead = async (leadData) => {
    const res = await api.createInfluencer(leadData)
    await fetchStats()
    await fetchInfluencers(1, filters)
    return res
  }

  return (
    <div
      className="min-h-screen font-inter transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b px-6 py-3.5 flex items-center justify-between transition-colors"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Scout CRM
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                v1.2
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Playbook de Mineração, Triagem Anti-Lixo e ROI de Stories (.bet.br)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Badge de status do motor */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Motor de Triagem Ativo</span>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-zinc-600" />
            )}
          </button>

          {/* Adicionar Lead Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <UserPlus size={14} />
            <span>+ Novo Lead</span>
          </button>

          {/* Minerar Button */}
          <button
            onClick={() => setMineModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Sparkles size={14} />
            <span>Minerar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={18} className="shrink-0" />
            <div className="flex-1">
              <strong>Erro de Conexão:</strong> {error}
            </div>
            <button
              onClick={() => {
                fetchStats()
                fetchInfluencers(1, filters)
              }}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* 1. KPIs Section */}
        <section>
          <KPICards stats={stats} />
        </section>

        {/* 2. Filter Bar */}
        <section>
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onMineClick={() => setMineModalOpen(true)}
            onAddLeadClick={() => setCreateModalOpen(true)}
            onRefresh={() => {
              fetchStats()
              fetchInfluencers(page, filters)
            }}
            loading={loading}
          />
        </section>

        {/* 3. Influencer Table */}
        <section>
          <InfluencerTable
            influencers={influencers}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onSelectInfluencer={(inf) => setSelectedInfluencer(inf)}
            onStatusChange={handleStatusChange}
            loading={loading}
            onMineClick={() => setMineModalOpen(true)}
            onAddLeadClick={() => setCreateModalOpen(true)}
          />
        </section>
      </main>

      {/* Drawer Lateral com Calculadora de ROI e Scripts do Pedro */}
      <InfluencerDrawer
        influencer={selectedInfluencer}
        onClose={() => setSelectedInfluencer(null)}
        onUpdate={handleDrawerUpdate}
      />

      {/* Modal de Mineração Inteligente */}
      <MineModal
        open={mineModalOpen}
        onClose={() => setMineModalOpen(false)}
        onMine={handleMine}
      />

      {/* Modal de Cadastro Manual de Criador */}
      <CreateLeadModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreateLead}
      />
    </div>
  )
}
