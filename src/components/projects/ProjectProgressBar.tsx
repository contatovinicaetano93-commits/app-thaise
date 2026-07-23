'use client'

import type { Project } from '@/types/database'

interface Props {
  project: Project
  compact?: boolean
}

/** Barra de progresso simples — obra como container (sem fases na UI). */
export function ProjectProgressBar({ project }: Props) {
  const pct = project.progress_pct ?? 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600">Progresso da obra</span>
        <span className="text-sm font-bold text-violet-700">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}
