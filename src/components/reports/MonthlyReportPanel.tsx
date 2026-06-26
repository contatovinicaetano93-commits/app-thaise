'use client'

import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react'
import { PanelCard } from '@/components/ui/PanelCard'
import type { MonthlyReportData } from '@/lib/hooks/use-monthly-report'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

type MonthlyReportPanelProps = {
  data: MonthlyReportData | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  defaultOpen?: boolean
  compact?: boolean
}

export function MonthlyReportPanel({
  data,
  loading = false,
  error = null,
  onRetry,
  defaultOpen = true,
  compact = false,
}: MonthlyReportPanelProps) {
  const periodLabel = data?.periodLabel ?? new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const summaryPreview = loading
    ? 'Gerando relatório…'
    : error
      ? 'Erro ao carregar'
      : data?.summary
        ? data.summary.slice(0, 80) + (data.summary.length > 80 ? '…' : '')
        : 'Sem dados do mês'

  return (
    <PanelCard
      panelId="monthly-report"
      title="Relatório mensal"
      icon={Sparkles}
      defaultOpen={defaultOpen}
      className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-white"
      summary={summaryPreview}
      href={compact ? '/reports' : undefined}
      menuItems={[
        { label: 'Abrir página completa', href: '/reports' },
        { label: 'Ver insights QCPS', href: '/insights' },
        ...(onRetry ? [{ label: 'Atualizar', onClick: onRetry }] : []),
      ]}
      headerExtra={
        data?.aiPowered ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-violet-600 text-white px-2 py-0.5 rounded-full">
            <Sparkles size={10} />
            IA
          </span>
        ) : !loading && !error ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Automático
          </span>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-3 py-2">
          <div className="h-4 bg-violet-100 rounded animate-pulse w-full" />
          <div className="h-4 bg-violet-100 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-violet-100 rounded animate-pulse w-4/6" />
          <p className="text-xs text-violet-600">Consultando dados e gerando análise…</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          )}
        </div>
      ) : data ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          {!compact && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-violet-100">
              <Metric label="Pedidos" value={String(data.metrics.orders)} />
              <Metric label="Receita" value={fmt(data.metrics.revenue)} />
              <Metric label="Fornecedores" value={String(data.metrics.activeSuppliers)} />
              <Metric label="QCPS médio" value={`${data.metrics.avgQcps}/10`} icon={TrendingUp} />
            </div>
          )}
          <p className="text-[11px] text-gray-400 capitalize">Período: {periodLabel}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">Nenhum dado disponível para este mês.</p>
      )}
    </PanelCard>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="rounded-xl bg-white/80 border border-violet-100 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900 flex items-center gap-1 mt-0.5">
        {Icon && <Icon size={12} className="text-violet-500" />}
        {value}
      </p>
    </div>
  )
}
