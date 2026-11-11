import React, { useState, useEffect, useCallback } from 'react'
import { api } from './lib/api'
import KPICards from './components/KPICards'
import FilterBar from './components/FilterBar'
import InfluencerTable from './components/InfluencerTable'
import InfluencerDrawer from './components/InfluencerDrawer'
import MineModal from './components/MineModal'
import CreateLeadModal from './components/CreateLeadModal'
import CreatePublicidadeModal from './components/CreatePublicidadeModal'
import PublicidadesView from './components/PublicidadesView'
import MetasView from './components/MetasView'
import ImportView from './components/ImportView'
import {
  Sparkles,
  Sun,
  Moon,
  AlertCircle,
  UserPlus,
  Users,
  DollarSign,
  Target,
  FileSpreadsheet,
} from 'lucide-react'

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('scout_theme') || 'dark'
  })

  // Aba ativa: 'captacao' | 'publicidades' | 'metas' | 'importar'
  const [currentTab, setCurrentTab] = useState('captacao')

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
    ghost: 0,
    conversionRate: 0,
  })
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    classification: '',
    minFollowers: '',
    hideAgencies: false,
    onlyMined: false,
    sortBy: 'recent',
  })
  const [dbStatus, setDbStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Drawer do Influenciador
  const [selectedInfluencer, setSelectedInfluencer] = useState(null)

  // Modais
  const [mineModalOpen, setMineModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createPubliModalOpen, setCreatePubliModalOpen] = useState(false)
  const [publiInitialData, setPubliInitialData] = useState({})

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

  // Carregar dados de estatísticas da Captação
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

  // Efeito inicial: hidrata cache de minerados caso Vercel/Memória reinicie e verifica Supabase
  useEffect(() => {
    const boot = async () => {
      try {
        const rawCache = localStorage.getItem('scout_mined_cache_v2')
        if (rawCache) {
          const parsed = JSON.parse(rawCache)
          if (Array.isArray(parsed) && parsed.length > 0) {
            await api.batchSyncInfluencers(parsed).catch(() => {})
          }
        }
      } catch {
        // Ignora erro de localStorage
      }

      api.getHealth()
        .then((h) => setDbStatus(h?.supabase || null))
        .catch(() => {})

      fetchStats()
      fetchInfluencers(1, filters)
    }
    boot()
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

  // Mudança inline de status na tabela de captação
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

      // Se mudou para Fechou, oferece na hora criar a publicidade preenchida
      if (newStatus === 'Fechou') {
        const inf = influencers.find((i) => i.id === id)
        if (inf) {
          setPubliInitialData({
            influencer_username: inf.username,
            influencer_name: inf.full_name,
            whatsapp: inf.whatsapp,
            game: inf.campaign_game || 'Block Win',
          })
          setCreatePubliModalOpen(true)
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err.message)
      fetchInfluencers(page, filters)
    }
  }

  // Atualização a partir do Drawer
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

  // Cadastro Manual de Criador
  const handleCreateLead = async (leadData) => {
    const res = await api.createInfluencer(leadData)
    await fetchStats()
    await fetchInfluencers(1, filters)
    return res
  }

  // Disparar criação de publicidade vinda do Drawer ou tabela
  const handleOpenCreatePubliForInfluencer = (inf) => {
    setPubliInitialData({
      influencer_username: inf.username,
      influencer_name: inf.full_name,
      whatsapp: inf.whatsapp,
      game: inf.campaign_game || 'Block Win',
    })
    setCreatePubliModalOpen(true)
  }

  // Abrir perfil do influenciador a partir de qualquer view (por username)
  const handleSelectInfluencerByUsername = async (username) => {
    const found = influencers.find((i) => i.username?.toLowerCase() === username.toLowerCase())
    if (found) {
      setSelectedInfluencer(found)
    } else {
      try {
        const profile = await api.getInfluencerFullProfile(username)
        if (profile?.influencer) {
          setSelectedInfluencer(profile.influencer)
        }
      } catch (_e) {
        // ignora
      }
    }
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
        className="sticky top-0 z-40 backdrop-blur-md border-b px-6 py-3 flex items-center justify-between transition-colors"
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
                v2.0 ERP
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Operação de Afiliados .bet.br — Captação, Publicidades & Metas
            </p>
          </div>
        </div>

        {/* Central Segmented Tab Switcher */}
        <div
          className="hidden md:flex p-1 rounded-2xl border text-xs font-semibold"
          style={{
            backgroundColor: 'var(--bg-card-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            onClick={() => setCurrentTab('captacao')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              currentTab === 'captacao'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-blue-500 text-zinc-400'
            }`}
          >
            <Users size={13} />
            <span>Captação SDR</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'captacao' ? 'bg-white/20 text-white' : 'bg-zinc-500/10 text-zinc-400'
              }`}
            >
              {total}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('publicidades')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              currentTab === 'publicidades'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-blue-500 text-zinc-400'
            }`}
          >
            <DollarSign size={13} />
            <span>Publicidades</span>
          </button>

          <button
            onClick={() => setCurrentTab('metas')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              currentTab === 'metas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-blue-500 text-zinc-400'
            }`}
          >
            <Target size={13} />
            <span>Metas de Depositantes</span>
          </button>

          <button
            onClick={() => setCurrentTab('importar')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              currentTab === 'importar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-blue-500 text-zinc-400'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Planilhas</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {dbStatus && (
            <span
              title={
                dbStatus.online
                  ? 'Supabase conectado e ativo'
                  : 'Supabase em pausa/offline — leads minerados protegidos no cache local e memória'
              }
              className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                dbStatus.online
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{dbStatus.online ? 'DB Online' : 'Modo Local/Cache'}</span>
            </span>
          )}

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

          {/* Botões contextuais */}
          {currentTab === 'captacao' && (
            <>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <UserPlus size={14} />
                <span>+ Novo Lead</span>
              </button>

              <button
                onClick={() => setMineModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Sparkles size={14} />
                <span>Minerar</span>
              </button>
            </>
          )}

          {currentTab === 'publicidades' && (
            <button
              onClick={() => {
                setPubliInitialData({})
                setCreatePubliModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <DollarSign size={14} />
              <span>+ Nova Publicidade</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div
        className="md:hidden flex border-b px-4 py-2 gap-1 overflow-x-auto text-xs font-semibold"
        style={{
          backgroundColor: 'var(--bg-card-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <button
          onClick={() => setCurrentTab('captacao')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${
            currentTab === 'captacao' ? 'bg-blue-600 text-white' : 'text-zinc-400'
          }`}
        >
          🎯 Captação ({total})
        </button>
        <button
          onClick={() => setCurrentTab('publicidades')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${
            currentTab === 'publicidades' ? 'bg-blue-600 text-white' : 'text-zinc-400'
          }`}
        >
          💰 Publicidades
        </button>
        <button
          onClick={() => setCurrentTab('metas')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${
            currentTab === 'metas' ? 'bg-blue-600 text-white' : 'text-zinc-400'
          }`}
        >
          🏁 Metas
        </button>
        <button
          onClick={() => setCurrentTab('importar')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${
            currentTab === 'importar' ? 'bg-blue-600 text-white' : 'text-zinc-400'
          }`}
        >
          📥 Planilhas
        </button>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle size={18} className="shrink-0" />
            <div className="flex-1">
              <strong>Erro:</strong> {error}
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

        {/* VIEW 1: CAPTAÇÃO SDR */}
        {currentTab === 'captacao' && (
          <>
            <KPICards stats={stats} />
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
          </>
        )}

        {/* VIEW 2: PUBLICIDADES FINANCEIRAS */}
        {currentTab === 'publicidades' && (
          <PublicidadesView onSelectInfluencer={handleSelectInfluencerByUsername} />
        )}

        {/* VIEW 3: METAS DE DEPOSITANTES */}
        {currentTab === 'metas' && (
          <MetasView onSelectInfluencer={handleSelectInfluencerByUsername} />
        )}

        {/* VIEW 4: IMPORTAÇÃO & EXPORTAÇÃO */}
        {currentTab === 'importar' && (
          <ImportView
            onDataChanged={() => {
              fetchStats()
              fetchInfluencers(1, filters)
            }}
          />
        )}
      </main>

      {/* Drawer Lateral Unificado com Histórico e Ações */}
      <InfluencerDrawer
        influencer={selectedInfluencer}
        onClose={() => setSelectedInfluencer(null)}
        onUpdate={handleDrawerUpdate}
        onCreatePublicidadeForInfluencer={handleOpenCreatePubliForInfluencer}
      />

      {/* Modal de Mineração Inteligente */}
      <MineModal
        open={mineModalOpen}
        onClose={() => setMineModalOpen(false)}
        onComplete={async (newItems = []) => {
          if (Array.isArray(newItems) && newItems.length > 0) {
            try {
              const existingRaw = localStorage.getItem('scout_mined_cache_v2')
              const existing = existingRaw ? JSON.parse(existingRaw) : []
              const mergedMap = new Map()
              for (const item of [...newItems, ...existing]) {
                if (item?.username) mergedMap.set(item.username.toLowerCase(), item)
              }
              const merged = Array.from(mergedMap.values()).slice(0, 200)
              localStorage.setItem('scout_mined_cache_v2', JSON.stringify(merged))
            } catch {
              // Ignora se storage cheio
            }
            await api.batchSyncInfluencers(newItems).catch(() => {})
          }

          const updatedFilters = {
            ...filters,
            search: '',
            status: '',
            classification: '',
            sortBy: 'recent',
          }
          setFilters(updatedFilters)
          setPage(1)
          fetchStats()
          fetchInfluencers(1, updatedFilters)
        }}
      />

      {/* Modal de Cadastro Manual de Criador */}
      <CreateLeadModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreateLead}
      />

      {/* Modal de Criação de Publicidade */}
      <CreatePublicidadeModal
        open={createPubliModalOpen}
        onClose={() => {
          setCreatePubliModalOpen(false)
          setPubliInitialData({})
        }}
        initialData={publiInitialData}
        onCreated={async (publiData) => {
          await api.createPublicidade(publiData)
          setCurrentTab('publicidades')
        }}
      />
    </div>
  )
}
