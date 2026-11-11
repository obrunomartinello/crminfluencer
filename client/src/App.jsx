import React, { useState, useEffect, useCallback } from 'react'
import { api } from './lib/api'
import Sidebar from './components/Sidebar'
import DashboardView from './components/DashboardView'
import KanbanBoard from './components/KanbanBoard'
import SentLeadsView from './components/SentLeadsView'
import FilterBar from './components/FilterBar'
import InfluencerTable from './components/InfluencerTable'
import InfluencerDrawer from './components/InfluencerDrawer'
import MineModal from './components/MineModal'
import CreateLeadModal from './components/CreateLeadModal'
import CreatePublicidadeModal from './components/CreatePublicidadeModal'
import PublicidadesView from './components/PublicidadesView'
import MetasView from './components/MetasView'
import ImportView from './components/ImportView'
import ApifyThermometer from './components/ApifyThermometer'
import {
  Sun,
  Moon,
  AlertCircle,
  Menu,
  Columns3,
  List,
} from 'lucide-react'

const TAB_HEADERS = {
  dashboard: {
    title: '🎰 Dashboard da Casa',
    subtitle: 'Placar ao vivo da captação SDR, envios e lucro das apostas',
  },
  kanban: {
    title: '🃏 CRM Kanban — Mesa de Prospecção',
    subtitle: 'Puxe na fila: 🎯 Para Abordar → 🚀 Msg Enviada → 🃏 Negociando → 🏆 Fechou',
  },
  sent: {
    title: '🚀 Painel Já Mandados',
    subtitle: 'Acompanhamento exclusivo de mensagens disparadas, respostas e follow-ups',
  },
  publicidades: {
    title: '💰 Controle de Publicidades',
    subtitle: 'Gestão de banca, pagamentos, Stories e ROI das campanhas',
  },
  metas: {
    title: '🏆 Metas de Depositantes',
    subtitle: 'Placar de depositantes batidos vs. meta combinada',
  },
  importar: {
    title: '📋 Planilhas & Backup',
    subtitle: 'Importação e exportação em CSV e Excel',
  },
}

function updateCachedLead(updatedLead) {
  if (!updatedLead?.username) return
  try {
    const raw = localStorage.getItem('scout_mined_cache_v2')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    const idx = parsed.findIndex((i) => i.username?.toLowerCase() === updatedLead.username.toLowerCase())
    if (idx !== -1) {
      parsed[idx] = { ...parsed[idx], ...updatedLead }
      localStorage.setItem('scout_mined_cache_v2', JSON.stringify(parsed))
    }
  } catch {
    // Ignora erro de localStorage
  }
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('scout_theme_v3') || 'light'
  })

  // Navegação principal estilo SaaS: 'dashboard' | 'kanban' | 'sent' | 'publicidades' | 'metas' | 'importar'
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [kanbanMode, setKanbanMode] = useState('board') // 'board' | 'table'
  const [sentInitialStatus, setSentInitialStatus] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    toContactCount: 0,
    sentWaitingCount: 0,
    sentTotalCount: 0,
    repliedCount: 0,
    responseRate: 0,
    missingDataCount: 0,
    channelCounts: {},
    statusCounts: {},
    publicidadesSummary: {},
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
  const [apifyQuota, setApifyQuota] = useState(null)
  const [quotaLoading, setQuotaLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Drawer & Modais
  const [selectedInfluencer, setSelectedInfluencer] = useState(null)
  const [mineModalOpen, setMineModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createPubliModalOpen, setCreatePubliModalOpen] = useState(false)
  const [publiInitialData, setPubliInitialData] = useState({})

  // Gerenciamento de Tema (Claro padrão estilo ZapData + Escuro opcional)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('scout_theme_v3', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats()
      if (data) setStats(data)
    } catch (err) {
      console.warn('Erro ao carregar stats:', err.message)
    }
  }, [])

  const fetchApifyQuota = useCallback(async (forceRefresh = false) => {
    setQuotaLoading(true)
    try {
      const q = await api.getMineQuota(forceRefresh)
      if (q) setApifyQuota(q)
    } catch (err) {
      console.warn('Erro ao consultar cota Apify:', err.message)
    } finally {
      setQuotaLoading(false)
    }
  }, [])

  const fetchInfluencers = useCallback(
    async (customPage = page, customFilters = filters, modeOverride = kanbanMode) => {
      setLoading(true)
      setError(null)
      try {
        const isBoard = modeOverride === 'board'
        const res = await api.getInfluencers({
          ...customFilters,
          // No Kanban todas as 4 colunas devem carregar juntas; filtro de status individual fica no modo Lista
          status: isBoard ? '' : customFilters.status,
          page: isBoard ? 1 : customPage,
          limit: isBoard ? 200 : 15,
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
    },
    [page, filters, kanbanMode]
  )

  // Inicialização: hidrata leads minerados salvos localmente e carrega saúde/cota/dados
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

      fetchApifyQuota(false)
      fetchStats()
      fetchInfluencers(1, filters, 'board')
    }
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNavigateTab = (tabId, preset = {}) => {
    setCurrentTab(tabId)
    if (tabId === 'sent') {
      setSentInitialStatus(preset.status || '')
    }
    if (tabId === 'kanban') {
      const nextFilters = {
        ...filters,
        onlyMined: preset.onlyMined !== undefined ? preset.onlyMined : filters.onlyMined,
        status: preset.status !== undefined ? preset.status : filters.status,
      }
      setFilters(nextFilters)
      fetchInfluencers(1, nextFilters, kanbanMode)
    }
  }

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    setPage(1)
    fetchInfluencers(1, updated, kanbanMode)
  }

  const handleToggleKanbanMode = (nextMode) => {
    setKanbanMode(nextMode)
    setPage(1)
    fetchInfluencers(1, filters, nextMode)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      fetchInfluencers(newPage, filters, kanbanMode)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setInfluencers((prev) =>
      prev.map((i) => (String(i.id) === String(id) ? { ...i, status: newStatus } : i))
    )

    if (selectedInfluencer && String(selectedInfluencer.id) === String(id)) {
      setSelectedInfluencer((prev) => ({ ...prev, status: newStatus }))
    }

    try {
      const res = await api.updateInfluencer(id, { status: newStatus })
      if (res?.data) {
        setInfluencers((prev) =>
          prev.map((i) => (String(i.id) === String(id) ? { ...i, ...res.data } : i))
        )
        updateCachedLead(res.data)
      }
      fetchStats()

      if (newStatus === 'Fechou') {
        const inf = influencers.find((i) => String(i.id) === String(id))
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
      fetchInfluencers(page, filters, kanbanMode)
    }
  }

  const handleMarkSent = async (inf, channel) => {
    const nextStatus = !inf.status || inf.status === 'Novo' ? 'Mensagem Enviada' : inf.status
    const nowIso = new Date().toISOString()

    setInfluencers((prev) =>
      prev.map((i) =>
        String(i.id) === String(inf.id)
          ? {
              ...i,
              status: nextStatus,
              outreach_channel: channel,
              contacted_at: i.contacted_at || nowIso,
              last_contact_at: nowIso,
            }
          : i
      )
    )

    try {
      const res = await api.updateInfluencer(inf.id, {
        status: nextStatus,
        outreach_channel: channel,
      })
      if (res?.data) {
        setInfluencers((prev) =>
          prev.map((i) => (String(i.id) === String(inf.id) ? { ...i, ...res.data } : i))
        )
        updateCachedLead(res.data)
      }
      fetchStats()
    } catch (err) {
      console.error('Erro ao marcar mensagem enviada:', err.message)
      fetchInfluencers(page, filters, kanbanMode)
    }
  }

  const handleDrawerUpdate = async (id, data) => {
    try {
      const res = await api.updateInfluencer(id, data)
      const updated = res.data || { ...selectedInfluencer, ...data }

      setSelectedInfluencer(updated)
      setInfluencers((prev) =>
        prev.map((i) => (String(i.id) === String(id) ? { ...i, ...updated } : i))
      )
      updateCachedLead(updated)
      fetchStats()
    } catch (err) {
      console.error('Erro ao atualizar influenciador:', err.message)
    }
  }

  const handleCreateLead = async (leadData) => {
    const res = await api.createInfluencer(leadData)
    await fetchStats()
    await fetchInfluencers(1, filters, kanbanMode)
    return res
  }

  const handleOpenCreatePubliForInfluencer = (inf) => {
    setPubliInitialData({
      influencer_username: inf.username,
      influencer_name: inf.full_name,
      whatsapp: inf.whatsapp,
      game: inf.campaign_game || 'Block Win',
    })
    setCreatePubliModalOpen(true)
  }

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
      } catch {
        // Ignora erro caso não encontre
      }
    }
  }

  const activeHeader = TAB_HEADERS[currentTab] || TAB_HEADERS.dashboard

  useEffect(() => {
    const shortTitle = activeHeader.title.split(' — ')[0]
    document.title = `${shortTitle} | Jackpot CRM`
  }, [activeHeader.title])

  return (
    <div
      className="min-h-screen font-inter transition-colors duration-200 flex"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Sidebar Lateral Estilo SaaS */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigateTab(tab)}
        stats={stats}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área Principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar do Conteúdo */}
        <header
          className="sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 transition-colors"
          style={{
            backgroundColor: 'var(--header-bg)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {activeHeader.title}
              </h1>
              <p className="text-[11px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                {activeHeader.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ApifyThermometer
              quota={apifyQuota}
              loading={quotaLoading}
              onClick={() => {
                fetchApifyQuota(true)
                setMineModalOpen(true)
              }}
              variant="compact"
            />

            {dbStatus && (
              <span
                title={
                  dbStatus.online
                    ? `Supabase conectado e ativo (${dbStatus.count ?? 0} registros${dbStatus.latencyMs ? ` • ${dbStatus.latencyMs}ms` : ''})`
                    : 'Supabase em pausa/offline — leads minerados protegidos no cache local e memória'
                }
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  dbStatus.online
                    ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/12 border-amber-500/35 text-amber-700 dark:text-amber-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dbStatus.online ? 'bg-emerald-500 casino-jackpot-ring' : 'bg-amber-500'}`} />
                <span>{dbStatus.online ? '🟢 Casa Online' : '🟡 Modo Local'}</span>
              </span>
            )}

            <button
              type="button"
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

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all"
            >
              <span>🪙</span>
              <span>+ Novo Lead</span>
            </button>

            <button
              type="button"
              onClick={() => setMineModalOpen(true)}
              className="casino-btn-vegas casino-shimmer casino-hover-spin inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs rounded-xl active:scale-95"
            >
              <span className="casino-spin-target">🎰</span>
              <span>Minerar Leads</span>
            </button>

            {currentTab === 'publicidades' && (
              <button
                type="button"
                onClick={() => {
                  setPubliInitialData({})
                  setCreatePubliModalOpen(true)
                }}
                className="casino-btn-gold inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all"
              >
                <span>💰</span>
                <span>+ Nova Publi</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle size={18} className="shrink-0" />
              <div className="flex-1">
                <strong>Erro:</strong> {error}
              </div>
              <button
                type="button"
                onClick={() => {
                  fetchStats()
                  fetchInfluencers(1, filters, kanbanMode)
                }}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* VIEW 1: DASHBOARD ESTILO ZAPDATA */}
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              onNavigateTab={handleNavigateTab}
              onMineClick={() => setMineModalOpen(true)}
              onlyMinedFilter={filters.onlyMined}
              onToggleOnlyMined={(val) => handleFilterChange('onlyMined', val)}
            />
          )}

          {/* VIEW 2: CRM KANBAN (COM ALTERNADOR KANBAN / LISTA) */}
          {currentTab === 'kanban' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="inline-flex p-1 rounded-xl border text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleKanbanMode('board')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      kanbanMode === 'board' ? 'casino-btn-vegas shadow-sm' : ''
                    }`}
                    style={{ color: kanbanMode === 'board' ? undefined : 'var(--text-muted)' }}
                  >
                    <Columns3 size={13} />
                    <span>🎰 Visual Kanban</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleKanbanMode('table')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      kanbanMode === 'table' ? 'casino-btn-vegas shadow-sm' : ''
                    }`}
                    style={{ color: kanbanMode === 'table' ? undefined : 'var(--text-muted)' }}
                  >
                    <List size={13} />
                    <span>📋 Lista / Tabela ({total})</span>
                  </button>
                </div>

                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Exibindo <strong>{influencers.length}</strong> de <strong>{total}</strong> leads
                </span>
              </div>

              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                showStatusFilter={kanbanMode === 'table'}
                onRefresh={() => {
                  fetchStats()
                  fetchInfluencers(page, filters, kanbanMode)
                }}
                loading={loading}
              />

              {kanbanMode === 'board' ? (
                <KanbanBoard
                  influencers={influencers}
                  loading={loading}
                  onSelectInfluencer={setSelectedInfluencer}
                  onMarkSent={handleMarkSent}
                  onStatusChange={handleStatusChange}
                  onCreatePublicidadeForInfluencer={handleOpenCreatePubliForInfluencer}
                  onMineClick={() => setMineModalOpen(true)}
                  onOpenSentView={() => handleNavigateTab('sent')}
                />
              ) : (
                <InfluencerTable
                  influencers={influencers}
                  total={total}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  onSelectInfluencer={setSelectedInfluencer}
                  onStatusChange={handleStatusChange}
                  loading={loading}
                  onMineClick={() => setMineModalOpen(true)}
                  onAddLeadClick={() => setCreateModalOpen(true)}
                />
              )}
            </div>
          )}

          {/* VIEW 3: PAINEL EXCLUSIVO JÁ MANDADOS */}
          {currentTab === 'sent' && (
            <SentLeadsView
              stats={stats}
              initialStatusFilter={sentInitialStatus}
              onSelectInfluencer={setSelectedInfluencer}
              onStatusChange={handleStatusChange}
              onRefreshParentStats={fetchStats}
            />
          )}

          {/* VIEW 4: PUBLICIDADES */}
          {currentTab === 'publicidades' && (
            <PublicidadesView onSelectInfluencer={handleSelectInfluencerByUsername} />
          )}

          {/* VIEW 5: METAS */}
          {currentTab === 'metas' && (
            <MetasView onSelectInfluencer={handleSelectInfluencerByUsername} />
          )}

          {/* VIEW 6: PLANILHAS */}
          {currentTab === 'importar' && (
            <ImportView
              onDataChanged={() => {
                fetchStats()
                fetchInfluencers(1, filters, kanbanMode)
              }}
            />
          )}
        </main>
      </div>

      {/* Drawer Lateral Unificado & Editável */}
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
        quota={apifyQuota}
        quotaLoading={quotaLoading}
        onRefreshQuota={fetchApifyQuota}
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
            onlyMined: false,
            sortBy: 'recent',
          }
          setFilters(updatedFilters)
          setPage(1)
          setCurrentTab('kanban')
          setKanbanMode('board')
          fetchStats()
          fetchInfluencers(1, updatedFilters, 'board')
          fetchApifyQuota(true)
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
