'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

type RiskLevel = 'baixo' | 'medio' | 'alto'

const STYLE: Record<RiskLevel, string> = {
  baixo: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  medio: 'bg-amber-50 text-amber-800 border-amber-100',
  alto: 'bg-red-50 text-red-700 border-red-100',
}

interface Props {
  projectId: string
}

export function ProjectRiskBadge({ projectId }: Props) {
  const [risk, setRisk] = useState<{ nivel: RiskLevel; motivos: string[] } | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/risk`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (j.ok) setRisk(j.data) })
      .catch(() => {})
  }, [projectId])

  if (!risk || risk.nivel === 'baixo') return null

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs mb-3 ${STYLE[risk.nivel]}`}>
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Risco {risk.nivel}</p>
        {risk.motivos.length > 0 && (
          <p className="mt-0.5 opacity-90">{risk.motivos.join(' · ')}</p>
        )}
      </div>
    </div>
  )
}
