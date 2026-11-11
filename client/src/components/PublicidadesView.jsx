/**
 * @pilar PILAR 4 — Financeiro: Publicidades & Metas
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Filter,
  ExternalLink,
  ChevronDown,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Phone,
} from 'lucide-react'
import { api } from '../lib/api'
import { cleanInstagramHandle, getInstagramProfileUrl } from '../lib/instagram'
import CreatePublicidadeModal from './CreatePublicidadeModal'

const GAMES = ['Block Win', 'Bubble Win', 'Cust Win', 'Count Masters']

function formatBRL(val) {
  if (val === null || val === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatPercent(val) {
  if (val === null || val === undefined) return '—'
  const sign = val > 0 ? '+' : ''
  return `${sign}${(val * 100).toFixed(1)}%`
}

export default function PublicidadesView({ onSelectInfluencer }) {
  const [publicidades, setPublicidades] = useState([])
  const [stats, setStats] = useState({
    totalAds: 0,
    totalInvested: 0,
    totalCommissions: 0,
    totalReturn: 0,
    netProfit: 0,
    overallRoi: null,
    pendingPayment: 0,
    ghostCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAd, setEditingAd] = useState(null)

  const [filters, setFilters] = useState({
    influencer: '',
    game: '',
    closureType: '',
    deliveryStatus: '',
    paymentStatus: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resList, resStats] = await Promise.all([
        api.getPublicidades(filters),
        api.getPublicidadesStats(),
      ])
      setPublicidades(resList.data || [])
      if (resStats) setStats(resStats)
    } catch (err) {
      console.warn('Erro ao carregar publicidades:', err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreateOrUpdate = async (data) => {
    if (editingAd) {
      await api.updatePublicidade(editingAd.id, data)
    } else {
      await api.createPublicidade(data)
    }
    setEditingAd(null)
    loadData()
  }

  const handleTogglePayment = async (ad) => {
    const newStatus = ad.payment_status === 'Pago' ? 'Pendente' : 'Pago'
    await api.updatePublicidade(ad.id, { payment_status: newStatus })
    loadData()
  }

  const handleToggleDelivery = async (ad) => {
    const nextStatus =
      ad.delivery_status === 'Agendada'
        ? 'Postada'
        : ad.delivery_status === 'Postada'
        ? 'Ghost'
        : 'Agendada'
    await api.updatePublicidade(ad.id, { delivery_status: nextStatus })
    loadData()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover esta publicidade?')) {
      await api.deletePublicidade(id)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Investido */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Total Investido
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {formatBRL(stats.totalInvested)}
          </div>
          <span className="text-[10px] text-zinc-400">{stats.totalAds} publicidades</span>
        </div>

        {/* Retorno Total */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Retorno Apurado
          </div>
          <div className="text-lg font-bold font-mono text-emerald-500">
            {formatBRL(stats.totalReturn)}
          </div>
          <span className="text-[10px] text-zinc-400">Total gerado</span>
        </div>

        {/* Lucro Líquido */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Lucro Líquido
          </div>
          <div
            className={`text-lg font-bold font-mono ${
              stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {formatBRL(stats.netProfit)}
          </div>
          <span className="text-[10px] text-zinc-400">Retorno - Custos</span>
        </div>

        {/* ROI Geral */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-1">
            ROI Geral
          </div>
          <div
            className={`text-lg font-bold font-mono ${
              stats.overallRoi !== null && stats.overallRoi >= 0
                ? 'text-emerald-500'
                : stats.overallRoi !== null
                ? 'text-red-500'
                : 'text-zinc-400'
            }`}
          >
            {stats.overallRoi !== null ? formatPercent(stats.overallRoi) : '—'}
          </div>
          <span className="text-[10px] text-zinc-400">Sobre pubs apuradas</span>
        </div>

        {/* Pendente de Pagamento */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
            Pendente Pagar
          </div>
          <div className="text-lg font-bold font-mono text-amber-500">
            {formatBRL(stats.pendingPayment)}
          </div>
          <span className="text-[10px] text-zinc-400">Aguardando repasse</span>
        </div>

        {/* Comissões & Ghosts */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-purple-500 uppercase tracking-wider mb-1">
            Comissões / Ghost
          </div>
          <div className="text-lg font-bold font-mono text-purple-500">
            {formatBRL(stats.totalCommissions)}
          </div>
          <span className="text-[10px] text-red-500 font-medium">
            {stats.ghostCount} Ghost(s) detectado(s)
          </span>
        </div>
      </div>

      {/* 2. Filter Bar & Actions */}
      <div
        className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[200px]">
          {/* Busca Influenciador */}
          <input
            type="text"
            value={filters.influencer}
            onChange={(e) => handleFilterChange('influencer', e.target.value)}
            placeholder="Buscar por @ ou nome..."
            className="px-3.5 py-2 border rounded-xl text-xs flex-1 min-w-[160px]"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />

          {/* Jogo Dropdown */}
          <select
            value={filters.game}
            onChange={(e) => handleFilterChange('game', e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Jogo: Todos</option>
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Tipo Fechamento */}
          <select
            value={filters.closureType}
            onChange={(e) => handleFilterChange('closureType', e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Fechamento: Todos</option>
            <option value="Fixo">Fixo</option>
            <option value="Por meta">Por meta de depositantes</option>
          </select>

          {/* Status de Entrega */}
          <select
            value={filters.deliveryStatus}
            onChange={(e) => handleFilterChange('deliveryStatus', e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Entrega: Todas</option>
            <option value="Postada">Postada</option>
            <option value="Agendada">Agendada</option>
            <option value="Ghost">Ghost (Não postou)</option>
          </select>

          {/* Status de Pagamento */}
          <select
            value={filters.paymentStatus}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Pagamento: Todos</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
          </select>

          <button
            onClick={loadData}
            title="Recarregar"
            className="p-2 border rounded-xl hover:bg-zinc-500/10 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button
          onClick={() => {
            setEditingAd(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus size={15} />
          <span>+ Nova Publicidade</span>
        </button>
      </div>

      {/* 3. Tabela de Publicidades */}
      <div
        className="border rounded-2xl overflow-hidden shadow-sm transition-colors"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="border-b font-semibold"
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)',
                }}
              >
                <th className="py-3 px-4">Influenciador</th>
                <th className="py-3 px-3">Jogo / Campanha</th>
                <th className="py-3 px-3">Tipo & Período</th>
                <th className="py-3 px-3 text-right">Investido</th>
                <th className="py-3 px-3 text-right">Comissão</th>
                <th className="py-3 px-3 text-right font-bold">Custo Total</th>
                <th className="py-3 px-3 text-right">Retorno</th>
                <th className="py-3 px-3 text-center">ROI</th>
                <th className="py-3 px-3 text-center">Entrega</th>
                <th className="py-3 px-3 text-center">Pagamento</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {publicidades.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-zinc-500">
                    Nenhuma publicidade encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                publicidades.map((ad) => {
                  const hasRoi = ad.roi !== null && ad.roi !== undefined
                  const isPositive = hasRoi && ad.roi >= 0

                  return (
                    <tr
                      key={ad.id}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => onSelectInfluencer && onSelectInfluencer(ad.influencer_username)}
                    >
                      {/* Influenciador */}
                      <td className="py-3 px-4">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {ad.influencer_name}
                        </div>
                        {getInstagramProfileUrl(ad.influencer_username) ? (
                          <a
                            href={getInstagramProfileUrl(ad.influencer_username)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline text-[11px] flex items-center gap-0.5 text-blue-500"
                          >
                            @{cleanInstagramHandle(ad.influencer_username)}
                            <ExternalLink size={9} />
                          </a>
                        ) : (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            @{ad.influencer_username}
                          </span>
                        )}
                      </td>

                      {/* Jogo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {ad.game}
                        </span>
                      </td>

                      {/* Tipo & Período */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {ad.closure_type === 'Por meta'
                            ? `${ad.target_depositors || 0} Dep. (Meta)`
                            : 'Fixo'}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {ad.start_date ? ad.start_date : '—'}
                          {ad.end_date ? ` até ${ad.end_date}` : ''}
                        </div>
                      </td>

                      {/* Investido */}
                      <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatBRL(ad.invested_amount)}
                      </td>

                      {/* Comissão de Indicação */}
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        {ad.referral_commission > 0 ? (
                          <span title={`Indicado por: ${ad.referral_name || 'Alguém'}`} className="text-purple-400">
                            {formatBRL(ad.referral_commission)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Custo Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatBRL(ad.total_cost || ad.invested_amount)}
                      </td>

                      {/* Retorno */}
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        {ad.return_amount !== null && ad.return_amount !== undefined ? (
                          <span className="text-emerald-500">{formatBRL(ad.return_amount)}</span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* ROI (%) Colorido */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {hasRoi ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPositive
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            }`}
                          >
                            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {formatPercent(ad.roi)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-bold">—</span>
                        )}
                      </td>

                      {/* Entrega Toggle */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleDelivery(ad)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                            ad.delivery_status === 'Postada'
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : ad.delivery_status === 'Ghost'
                              ? 'bg-red-500/15 text-red-500 border-red-500/30'
                              : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                          }`}
                          title="Clique para alternar entrega"
                        >
                          {ad.delivery_status}
                        </button>
                      </td>

                      {/* Pagamento Toggle */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePayment(ad)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                            ad.payment_status === 'Pago'
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                          }`}
                          title="Clique para alternar pagamento"
                        >
                          {ad.payment_status}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingAd(ad)
                              setModalOpen(true)
                            }}
                            className="px-2 py-1 text-[11px] rounded-lg border hover:bg-zinc-500/10 transition-colors"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="px-2 py-1 text-[11px] rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Totais no Rodapé */}
            {publicidades.length > 0 && (
              <tfoot>
                <tr
                  className="border-t-2 font-bold"
                  style={{
                    backgroundColor: 'var(--bg-card-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <td colSpan="3" className="py-3 px-4">
                    TOTAIS DA TABELA ({publicidades.length} registros)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-400">
                    {formatBRL(publicidades.reduce((acc, p) => acc + (p.invested_amount || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-purple-400">
                    {formatBRL(publicidades.reduce((acc, p) => acc + (p.referral_commission || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatBRL(publicidades.reduce((acc, p) => acc + (p.total_cost || p.invested_amount || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-500">
                    {formatBRL(publicidades.reduce((acc, p) => acc + (p.return_amount || 0), 0))}
                  </td>
                  <td colSpan="4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <CreatePublicidadeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingAd(null)
        }}
        onCreated={handleCreateOrUpdate}
        initialData={editingAd || {}}
      />
    </div>
  )
}
