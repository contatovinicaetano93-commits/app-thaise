'use client'

import { useMemo } from 'react'
import type { Project, ProjectPhaseRow } from '@/types/database'

interface Props {
  project: Project
  compact?: boolean
}

export function ProjectProgressBar({ project, compact }: Props) {
  const phases = project.phases ?? []
  const pct = project.progress_pct ?? 0
  const current = project.current_phase ?? phases.find(p => p.id === project.current_phase_id)

  const phaseSegments = useMemo(() => {
    if (phases.length === 0) return []
    return phases.map((ph, i) => {
      const isPast = current ? ph.sort_order < (current.sort_order ?? 0) : false
      const isCurrent = ph.id === current?.id
      return { ...ph, isPast, isCurrent, index: i }
    })
  }, [phases, current])

  if (phases.length === 0 && pct === 0) return null

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600">
          {current ? `Fase: ${current.name}` : 'Progresso da obra'}
        </span>
        <span className="text-sm font-bold text-violet-700">{pct.toFixed(0)}%</span>
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      {!compact && phaseSegments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {phaseSegments.map(ph => (
            <span
              key={ph.id}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                ph.isCurrent
                  ? 'bg-violet-100 text-violet-800 ring-1 ring-violet-300'
                  : ph.isPast
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {ph.name} ({ph.weight_pct}%)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
