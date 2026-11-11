/**
 * @pilar PILAR 5 — Infraestrutura, Planilhas & Visual Jackpot
 */
import React, { useState } from 'react'
import {
  Upload,
  Download,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { api } from '../lib/api'

export default function ImportView({ onDataChanged }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleResetPedro = async () => {
    if (
      !window.confirm(
        'Deseja carregar a base oficial com os 87 influenciadores, 18 publicidades e 11 metas das planilhas do Pedro?'
      )
    ) {
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await api.resetPedroData()
      setMessage(`🎉 ${res.message} (99 influenciadores, 18 publicidades, 11 metas carregadas).`)
      if (onDataChanged) onDataChanged()
    } catch (err) {
      setError(err.message || 'Erro ao restaurar dados')
    } finally {
      setLoading(false)
    }
  }

  // Exportar para CSV
  const handleExport = async (type) => {
    try {
      let data = []
      let filename = 'export.csv'

      if (type === 'captacao') {
        const res = await api.getInfluencers({ limit: 500 })
        data = res.data || []
        filename = 'captacao_influenciadores.csv'
      } else if (type === 'publicidades') {
        const res = await api.getPublicidades({ limit: 500 })
        data = res.data || []
        filename = 'controle_publicidades.csv'
      } else if (type === 'metas') {
        const res = await api.getMetas()
        data = res.data || []
        filename = 'metas_depositantes.csv'
      }

      if (data.length === 0) {
        alert('Nenhum dado para exportar')
        return
      }

      const headers = Object.keys(data[0]).join(',')
      const rows = data.map((obj) =>
        Object.values(obj)
          .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Erro ao exportar: ' + err.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert de Sucesso ou Erro */}
      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Card 1: Restaurar Dados Oficiais do Pedro */}
      <div
        className="p-6 rounded-2xl border transition-colors shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Carga das Planilhas Oficiais do Pedro
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Contém os 87 influenciadores contatados, as 17 publicidades e as 11 metas das abas do Excel
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Ao clicar no botão abaixo, o sistema alimenta automaticamente todas as abas (Captação, Publicidades e Metas) com os dados oficiais do Pedro, aplicando as regras de normalização de jogos (Block Win, Bubble Win, Cust Win, Count Masters), formatação de WhatsApp e cálculo de ROI.
        </p>

        <div className="pt-2">
          <button
            onClick={handleResetPedro}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Carregando Dados...' : 'Carregar Dados Oficiais do Pedro'}</span>
          </button>
        </div>
      </div>

      {/* Card 2: Exportação de Dados para Excel/CSV */}
      <div
        className="p-6 rounded-2xl border transition-colors shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Exportar Tabelas para Excel / CSV
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Faça download a qualquer momento dos relatórios limpos em formato .csv
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => handleExport('captacao')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border hover:bg-zinc-500/10 transition-colors text-xs font-semibold"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <FileSpreadsheet size={16} className="text-blue-500" />
            <span>Exportar Captação (.csv)</span>
          </button>

          <button
            onClick={() => handleExport('publicidades')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border hover:bg-zinc-500/10 transition-colors text-xs font-semibold"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <FileSpreadsheet size={16} className="text-emerald-500" />
            <span>Exportar Publicidades (.csv)</span>
          </button>

          <button
            onClick={() => handleExport('metas')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border hover:bg-zinc-500/10 transition-colors text-xs font-semibold"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <FileSpreadsheet size={16} className="text-purple-500" />
            <span>Exportar Metas (.csv)</span>
          </button>
        </div>
      </div>

      {/* Card 3: Regras de Normalização Aplicadas */}
      <div
        className="p-6 rounded-2xl border transition-colors shadow-sm space-y-3"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <ShieldCheck size={16} className="text-blue-500" />
          <span>Regras de Normalização Ativas (Playbook do Pedro)</span>
        </div>

        <ul className="text-xs space-y-2" style={{ color: 'var(--text-muted)' }}>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Unificação por @:</strong> Sempre minúsculo, sem espaços e sem o caractere "@". O mesmo criador é reaproveitado em todos os módulos.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Padronização de Jogos:</strong> Variações como <em>BlockWin, Blockwin, Block Win</em> são convertidas automaticamente para <em>Block Win</em>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Telefones:</strong> Remoção de caracteres lixo e sufixos decimais (ex: <code>.0</code>), formatados no padrão BR <code>(XX) XXXXX-XXXX</code> com link direto para o WhatsApp.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Cálculo Real de ROI:</strong> <code>(Retorno - Custo Total) / Custo Total</code>. Publicidades sem retorno apurado mostram <code>—</code> e não entram no cálculo de ROI geral.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
