'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { PHASE_CHECKLISTS, phaseProgress, isChecklistItemDone } from '@/lib/checklists'
import type { ProjectPhase } from '@/lib/phases'
import type { ChecklistItemValue, PhaseChecklist } from '@/lib/auth/roles'

interface Props {
  phase: ProjectPhase
  checklist: PhaseChecklist
  onToggle: (itemId: string, checked: boolean, evidence?: string) => void
  readOnly?: boolean
}

function getEvidence(value: ChecklistItemValue | undefined): string {
  if (value && typeof value === 'object' && 'evidence' in value) return value.evidence ?? ''
  return ''
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
      <ul className="space-y-3">
        {items.map(item => {
          const value = phaseDone[item.id]
          const checked = isChecklistItemDone(value)
          const evidence = getEvidence(value)

          return (
            <li key={item.id} className="space-y-1.5">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onToggle(item.id, !checked, evidence || undefined)}
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
              {!readOnly && (
                <input
                  type="text"
                  placeholder="Evidência (link ou nota)"
                  value={evidence}
                  onChange={e => onToggle(item.id, checked, e.target.value)}
                  className="w-full ml-6 text-xs px-2 py-1.5 border border-gray-100 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
