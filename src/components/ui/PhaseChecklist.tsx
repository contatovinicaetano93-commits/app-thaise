'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { PHASE_CHECKLISTS, phaseProgress } from '@/lib/checklists'
import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'

interface Props {
  phase: ProjectPhase
  checklist: PhaseChecklist
  onToggle: (itemId: string, checked: boolean) => void
  readOnly?: boolean
}

export function PhaseChecklist({ phase, checklist, onToggle, readOnly }: Props) {
  const items = PHASE_CHECKLISTS[phase]
  const { done, total } = phaseProgress(phase, checklist)
  const phaseDone = checklist[phase] ?? {}

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-600">Checklist · Fase {phase}</p>
        <span className={`text-xs font-semibold ${done === total ? 'text-emerald-600' : 'text-amber-600'}`}>
          {done}/{total}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map(item => {
          const checked = phaseDone[item.id] === true
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onToggle(item.id, !checked)}
                className={`flex items-start gap-2 w-full text-left text-sm transition-colors ${
                  readOnly ? 'cursor-default' : 'hover:text-violet-700 cursor-pointer'
                } ${checked ? 'text-gray-500 line-through' : 'text-gray-700'}`}
              >
                {checked
                  ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <Circle size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                }
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
