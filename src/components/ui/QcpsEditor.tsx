'use client'

import { QCPS_KEYS, QCPS_LABELS, type QcpsScores } from '@/lib/qcps'

interface Props {
  values: QcpsScores
  onChange: (scores: QcpsScores) => void
}

export function QcpsEditor({ values, onChange }: Props) {
  function set(key: keyof QcpsScores, raw: string) {
    const n = Math.min(10, Math.max(0, parseFloat(raw) || 0))
    onChange({ ...values, [key]: n })
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {QCPS_KEYS.map(key => (
        <div key={key}>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            {QCPS_LABELS[key].label} ({QCPS_LABELS[key].short})
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={values[key]}
            onChange={e => set(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      ))}
    </div>
  )
}
