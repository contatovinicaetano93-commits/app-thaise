'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Building2, Truck } from 'lucide-react'
import { insightsApi, suppliersApi, type AgentInsightRow } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PanelCard } from '@/components/ui/PanelCard'
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles size={22} className="text-violet-600" />
          Insights AI
        </h2>
        <p className="text-gray-500 mt-1 text-sm">Análises QCPS geradas pelo agente</p>
      </div>

      {!loading && <QcpsComparisonChart suppliers={suppliers} />}

      {loading ? (
        <ListSkeleton rows={4} height="h-24" />
      ) : insights.length === 0 ? (
        <PanelCard title="Nenhum insight ainda" icon={Sparkles} padding="p-12" collapsible={false} menuItems={[{ label: 'Ver fornecedores', href: '/suppliers' }]}>
          <p className="text-sm text-gray-500 text-center">
            Entregue um pedido ou use o menu em fornecedores/empreendimentos para gerar análises.
          </p>
        </PanelCard>
      ) : (
        <div className="grid gap-3">
          {insights.map(row => (
            <PanelCard
              key={row.id}
              title={row.entity_type === 'supplier' ? 'Fornecedor' : 'Empreendimento'}
              icon={row.entity_type === 'supplier' ? Truck : Building2}
              padding="p-5"
              headerExtra={
                <span className="text-xs text-gray-400 ml-auto">
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
          ))}
        </div>
      )}
    </div>
  )
}
