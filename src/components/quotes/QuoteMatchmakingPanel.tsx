'use client'

import { Sparkles } from 'lucide-react'
import type { MatchmakingPick } from '@/lib/quotes/matchmaking'

interface Props {
  matchmaking: MatchmakingPick[]
  summary?: string
  aiPowered?: boolean
  marginNote?: string
}

const TIER_COLOR: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-violet-100 text-violet-800',
  C: 'bg-amber-100 text-amber-800',
}

export function QuoteMatchmakingPanel({ matchmaking, summary, aiPowered, marginNote }: Props) {
  if (matchmaking.length === 0 && !summary) return null

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-violet-600" />
        <p className="text-sm font-semibold text-violet-900">
          Matchmaking QCPS {aiPowered ? '· IA' : '· regras'}
        </p>
      </div>

      {summary && <p className="text-sm text-violet-900/90">{summary}</p>}

      {matchmaking.length > 0 && (
        <div className="space-y-2">
          {matchmaking.map(m => (
            <div key={m.category} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-gray-800">{m.category}</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-700">{m.supplier_name}</span>
              <span className="text-xs font-bold text-violet-700">QCPS {m.qcps_score}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TIER_COLOR[m.tier] ?? TIER_COLOR.B}`}>
                Nível {m.tier}
              </span>
              {m.alternatives.length > 0 && (
                <span className="text-xs text-gray-500">
                  (alt: {m.alternatives.map(a => `${a.name} ${a.score}`).join(', ')})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {marginNote && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {marginNote}
        </p>
      )}
    </div>
  )
}
