'use client'

import { PHASES, phaseIndex, type ProjectPhase } from '@/lib/phases'

interface Props {
  current: ProjectPhase
  onAdvance?: () => void
  advancing?: boolean
}

export function PhaseStepper({ current, onAdvance, advancing }: Props) {
  const idx = phaseIndex(current)
  const phaseInfo = PHASES[idx]
  const isLast = current === 'F'

  return (
    <div>
      <div className="flex items-center gap-1">
        {PHASES.map((p, i) => {
          const done = i < idx
          const active = i === idx
          return (
            <div key={p.id} className="flex items-center flex-1 min-w-0">
              <div
                title={`${p.label}: ${p.desc}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  active ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                  : done ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-400'
                }`}
              >
                {p.id}
              </div>
              {i < PHASES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-0.5 ${done ? 'bg-emerald-300' : 'bg-gray-100'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Fase {current} · {phaseInfo.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{phaseInfo.desc}</p>
        </div>
        {onAdvance && !isLast && (
          <button
            type="button"
            onClick={onAdvance}
            disabled={advancing}
            className="text-xs font-medium text-violet-600 hover:text-violet-800 whitespace-nowrap disabled:opacity-50"
          >
            {advancing ? 'Avançando...' : 'Avançar →'}
          </button>
        )}
        {isLast && (
          <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">Concluído</span>
        )}
      </div>
    </div>
  )
}
