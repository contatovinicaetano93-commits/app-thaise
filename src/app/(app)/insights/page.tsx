'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Building2, Truck } from 'lucide-react'
import { insightsApi, type AgentInsightRow } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { toast } from 'sonner'

export default function InsightsPage() {
  const [insights, setInsights] = useState<AgentInsightRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    insightsApi.list()
      .then(setInsights)
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

      {loading ? (
        <ListSkeleton rows={4} height="h-24" />
      ) : insights.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Sparkles size={24} className="text-violet-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Nenhum insight ainda</h3>
          <p className="text-sm text-gray-500">
            Entregue um pedido ou use o botão ✨ em fornecedores/empreendimentos para gerar análises.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {insights.map(row => (
            <div key={row.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {row.entity_type === 'supplier'
                  ? <Truck size={14} className="text-indigo-500" />
                  : <Building2 size={14} className="text-violet-500" />
                }
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {row.entity_type === 'supplier' ? 'Fornecedor' : 'Empreendimento'}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(row.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{row.insight}</p>
              {row.scores && (
                <div className="flex gap-3 mt-3 text-xs text-gray-500">
                  <span>Q: {row.scores.score_q}</span>
                  <span>C: {row.scores.score_c}</span>
                  <span>P: {row.scores.score_p}</span>
                  <span>S: {row.scores.score_s}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
