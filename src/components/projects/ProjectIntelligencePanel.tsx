'use client'

import { useEffect, useState } from 'react'
import { Brain, Loader2 } from 'lucide-react'
import { projectsApi, type ProjectIntelligence } from '@/lib/api'

interface Props {
  projectId: string
  compact?: boolean
}

export function ProjectIntelligencePanel({ projectId, compact }: Props) {
  const [data, setData] = useState<ProjectIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    projectsApi.intelligence(projectId)
      .then(res => { if (!cancelled) setData(res) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Erro') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 size={14} className="animate-spin" />
        Carregando inteligência da obra…
      </div>
    )
  }

  if (error || !data) return null

  const stats = [
    { label: 'Pedidos abertos', value: data.stats.open_orders },
    { label: 'Entregues', value: data.stats.delivered_orders },
    { label: 'Orçamentos OK', value: data.stats.approved_quotes },
    { label: 'SKUs pendentes', value: data.stats.pending_skus },
  ]

  return (
    <div className={`rounded-xl border border-violet-100 bg-violet-50/50 ${compact ? 'p-3' : 'p-4'} mb-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Brain size={16} className="text-violet-600" />
        <p className="text-sm font-semibold text-gray-900">Inteligência da obra</p>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
      {!compact && data.highlights.length > 0 && (
        <ul className="mt-2 space-y-1">
          {data.highlights.map((h, i) => (
            <li key={i} className="text-xs text-gray-500">• {h}</li>
          ))}
        </ul>
      )}
      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        {stats.filter(s => s.value > 0).map(s => (
          <span key={s.label} className="text-xs bg-white border border-violet-100 rounded-full px-2.5 py-0.5 text-gray-600">
            {s.label}: <strong>{s.value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
