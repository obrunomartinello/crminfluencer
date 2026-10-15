import React, { useState, useEffect, useCallback } from 'react'
import { api } from './lib/api'
import KPICards from './components/KPICards'
import FilterBar from './components/FilterBar'
import InfluencerTable from './components/InfluencerTable'
import InfluencerDrawer from './components/InfluencerDrawer'
import MineModal from './components/MineModal'
import { Sparkles, Shield, Database, RefreshCw, AlertCircle } from 'lucide-react'

export default function App() {
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
    // Atualização otimista na tabela
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

  // Atualização a partir do Drawer (ex: notas ou telefone)
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

  return (
    <div className="min-h-screen bg-apple-bg text-white font-inter selection:bg-apple-blue selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-apple-bg/80 backdrop-blur-md border-b border-apple-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">Scout CRM</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-apple-blue/15 text-apple-blue border border-apple-blue/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-apple-muted">
              Mineração, Triagem Anti-Bot e Abordagem de Influenciadores (.bet.br)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-surface border border-apple-border text-[11px] text-apple-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Motor de Triagem Ativo</span>
          </div>

          <button
            onClick={() => setMineModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-apple-blue hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
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
          <div className="p-4 bg-apple-red/10 border border-apple-red/30 rounded-2xl flex items-center gap-3 text-apple-red text-xs">
            <AlertCircle size={18} className="shrink-0" />
            <div className="flex-1">
              <strong>Erro de Comunicação:</strong> {error}
            </div>
            <button
              onClick={() => {
                fetchStats()
                fetchInfluencers(1, filters)
              }}
              className="px-3 py-1 bg-apple-red/20 hover:bg-apple-red/30 rounded-lg font-medium transition-colors"
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
          />
        </section>
      </main>

      {/* Drawer Lateral */}
      <InfluencerDrawer
        influencer={selectedInfluencer}
        onClose={() => setSelectedInfluencer(null)}
        onUpdate={handleDrawerUpdate}
      />

      {/* Modal de Mineração */}
      <MineModal
        open={mineModalOpen}
        onClose={() => setMineModalOpen(false)}
        onMine={handleMine}
      />
    </div>
  )
}
