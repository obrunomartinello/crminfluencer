/**
 * @pilar PILAR 4 — Financeiro: Publicidades & Metas
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  RotateCw,
  ExternalLink,
  Zap,
  Info,
} from 'lucide-react'
import { api } from '../lib/api'
import { cleanInstagramHandle, getInstagramProfileUrl } from '../lib/instagram'
import AddDepositantesModal from './AddDepositantesModal'

function formatBRL(val) {
  if (val === null || val === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function MetasView({ onSelectInfluencer }) {
  const [metas, setMetas] = useState([])
  const [stats, setStats] = useState({
    activeGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalReached: 0,
    overallProgress: 0,
    avgCpa: null,
  })
  const [loading, setLoading] = useState(true)
  const [selectedMeta, setSelectedMeta] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resList, resStats] = await Promise.all([api.getMetas(), api.getMetasStats()])
      setMetas(resList.data || [])
      if (resStats) setStats(resStats)
    } catch (err) {
      console.warn('Erro ao carregar metas:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleIncrement = async (metaId, amount) => {
    await api.incrementMeta(metaId, amount)
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metas Ativas */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Metas Ativas
          </div>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {stats.activeGoals} campanhas
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold">
            {stats.completedGoals} meta(s) batida(s)
          </span>
        </div>

        {/* Depositantes Alcançados */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-1">
            FTDs Alcançados
          </div>
          <div className="text-xl font-bold font-mono text-blue-500">
            {stats.totalReached} / {stats.totalTarget}
          </div>
          <span className="text-[10px] text-zinc-400">
            Faltam {Math.max(stats.totalTarget - stats.totalReached, 0)} para meta total
          </span>
        </div>

        {/* Atingimento Geral */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Atingimento Geral
          </div>
          <div className="text-xl font-bold font-mono text-emerald-500">
            {stats.overallProgress}%
          </div>
          <div className="w-full bg-zinc-500/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(stats.overallProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* CPA Médio */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="text-[11px] font-semibold text-purple-500 uppercase tracking-wider mb-1">
            CPA Médio (Custo/FTD)
          </div>
          <div className="text-xl font-bold font-mono text-purple-500">
            {stats.avgCpa ? formatBRL(stats.avgCpa) : '—'}
          </div>
          <span className="text-[10px] text-zinc-400">Por depositante confirmado</span>
        </div>

        {/* Regra de Ouro Pedro */}
        <div
          className="p-4 rounded-2xl border transition-colors shadow-sm bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
          style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">
            <Info size={13} />
            <span>Regra de Contagem</span>
          </div>
          <p className="text-[11px] leading-tight" style={{ color: 'var(--text-primary)' }}>
            Conta como depositante: <strong>Primeiro Depósito Confirmado (FTD)</strong>.
          </p>
        </div>
      </div>

      {/* 2. Header & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Campanhas com Metas de Depositantes
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-bold">
            {metas.length} em acompanhamento
          </span>
        </div>
        <button
          onClick={loadData}
          title="Recarregar metas"
          className="p-2 border rounded-xl hover:bg-zinc-500/10 transition-colors"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 3. Tabela de Metas com Barra de Progresso */}
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
                <th className="py-3 px-3 text-right">Investido</th>
                <th className="py-3 px-4 w-64">Progresso da Meta</th>
                <th className="py-3 px-3 text-center">Falta</th>
                <th className="py-3 px-3 text-right">CPA (Custo/FTD)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {metas.map((meta) => {
                const pct = Math.min(Math.round((meta.progress_pct || 0) * 100), 100)
                const isCompleted = meta.status === 'Meta atingida' || pct >= 100

                return (
                  <tr
                    key={meta.id}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onSelectInfluencer && onSelectInfluencer(meta.influencer_username)}
                  >
                    {/* Influenciador */}
                    <td className="py-3 px-4">
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {meta.influencer_name}
                      </div>
                      {getInstagramProfileUrl(meta.influencer_username) ? (
                        <a
                          href={getInstagramProfileUrl(meta.influencer_username)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline text-[11px] flex items-center gap-0.5 text-blue-500"
                        >
                          @{cleanInstagramHandle(meta.influencer_username)}
                          <ExternalLink size={9} />
                        </a>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          @{meta.influencer_username}
                        </span>
                      )}
                    </td>

                    {/* Jogo */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {meta.game}
                      </span>
                    </td>

                    {/* Investido */}
                    <td className="py-3 px-3 text-right font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatBRL(meta.invested_amount)}
                    </td>

                    {/* Barra de Progresso Visual */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {meta.reached_depositors} de {meta.target_depositors} FTDs
                          </span>
                          <span className={`font-bold ${isCompleted ? 'text-emerald-500' : 'text-blue-500'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-500/20 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Falta */}
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {meta.remaining_depositors > 0 ? (
                        <span className="text-amber-500">{meta.remaining_depositors}</span>
                      ) : (
                        <span className="text-emerald-500">0 ✓</span>
                      )}
                    </td>

                    {/* CPA */}
                    <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {meta.cpa ? formatBRL(meta.cpa) : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        <span>{isCompleted ? 'Meta Atingida' : 'Em Andamento'}</span>
                      </span>
                    </td>

                    {/* Ação Rápida + Depositantes */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedMeta(meta)
                          setModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <Plus size={13} />
                        <span>+ Depositantes</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Incremento Rápido */}
      <AddDepositantesModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedMeta(null)
        }}
        meta={selectedMeta}
        onIncrement={handleIncrement}
      />
    </div>
  )
}
