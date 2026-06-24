'use client'

import { QCPS_KEYS, QCPS_LABELS, qcpsAverage, qcpsColor, type QcpsScores } from '@/lib/qcps'

interface Props {
  scores: QcpsScores
  compact?: boolean
}

export function QcpsBar({ scores, compact }: Props) {
  const avg = qcpsAverage(scores)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {QCPS_KEYS.map(key => (
          <span key={key} className="text-xs font-medium text-gray-500">
            {QCPS_LABELS[key].short}
            <span className="ml-0.5 text-gray-800">{scores[key]}</span>
          </span>
        ))}
        <span className="text-xs font-bold text-violet-600 ml-1">{avg}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">QCPS</span>
        <span className="text-sm font-bold text-violet-600">{avg}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {QCPS_KEYS.map(key => (
          <div key={key}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-gray-400">{QCPS_LABELS[key].short}</span>
              <span className="text-[10px] font-medium text-gray-600">{scores[key]}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${qcpsColor(scores[key])}`}
                style={{ width: `${scores[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
