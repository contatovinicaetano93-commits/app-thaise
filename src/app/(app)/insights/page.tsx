'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Building2, Truck } from 'lucide-react'
import { insightsApi, suppliersApi, type AgentInsightRow } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { QcpsComparisonChart } from '@/components/insights/QcpsComparisonChart'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

export default function InsightsPage() {
  const [insights, setInsights] = useState<AgentInsightRow[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      insightsApi.list().then(setInsights),
      suppliersApi.list().then(setSuppliers),
    ])
      .catch(e => toast.error(e instanceof Error ? e.message : 'Erro ao carregar insights'))
      .finally(() => setLoading(false))
  }, [])

  const panels = [
    ...(suppliers.some(s => s.status === 'active') ? [{ id: 'qcps-chart', priority: 'primary' as const }] : []),
    ...insights.map(row => ({ id: `insight-${row.id}`, priority: 'secondary' as const })),
  ]

  return (
    <div className="space-y-3">
      <PageFeedHeader
        title="Insights AI"
        icon={Sparkles}
        subtitle="Análises QCPS geradas pelo agente"
        menuItems={[{ label: 'Ver fornecedores', href: '/suppliers' }, { label: 'Ver empreendimentos', href: '/projects' }]}
      />

      {panels.length > 0 && <PanelToolbar sections={panels} />}

      {!loading && <QcpsComparisonChart suppliers={suppliers} />}

      {loading ? (
        <ListSkeleton rows={4} height="h-14" />
      ) : insights.length === 0 ? (
        <PanelCard
          panelId="insights-empty"
          title="Nenhum insight ainda"
          icon={Sparkles}
          collapsible={false}
          summary="Entregue um pedido ou recalcule QCPS para gerar análises"
          menuItems={[{ label: 'Ver fornecedores', href: '/suppliers' }]}
        >
          <p className="text-sm text-gray-500 text-center">
            Entregue um pedido ou use o menu em fornecedores/empreendimentos para gerar análises.
          </p>
        </PanelCard>
      ) : (
        <div className="space-y-2">
          {insights.map(row => {
            const typeLabel = row.entity_type === 'supplier' ? 'Fornecedor' : 'Empreendimento'
            const avg = row.scores
              ? (((row.scores.score_q ?? 0) + (row.scores.score_c ?? 0) + (row.scores.score_p ?? 0) + (row.scores.score_s ?? 0)) / 4).toFixed(1)
              : null
            return (
              <PanelCard
                key={row.id}
                panelId={`insight-${row.id}`}
                title={typeLabel}
                icon={row.entity_type === 'supplier' ? Truck : Building2}
                defaultOpen={false}
                summary={`${row.insight.slice(0, 72)}${row.insight.length > 72 ? '…' : ''}${avg ? ` · QCPS ${avg}` : ''}`}
                headerExtra={
                  <span className="text-xs text-gray-400">
                    {new Date(row.created_at).toLocaleString('pt-BR')}
                  </span>
                }
                menuItems={[
                  { label: row.entity_type === 'supplier' ? 'Ver fornecedores' : 'Ver empreendimentos', href: row.entity_type === 'supplier' ? '/suppliers' : '/projects' },
                ]}
              >
                <p className="text-sm text-gray-800 leading-relaxed">{row.insight}</p>
                {row.scores && (
                  <div className="flex gap-3 mt-3 text-xs text-gray-500">
                    <span>Q: {row.scores.score_q}</span>
                    <span>C: {row.scores.score_c}</span>
                    <span>P: {row.scores.score_p}</span>
                    <span>S: {row.scores.score_s}</span>
                  </div>
                )}
              </PanelCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
