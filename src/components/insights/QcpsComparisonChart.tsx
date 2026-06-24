'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { qcpsAverage } from '@/lib/qcps'
import type { Supplier } from '@/types/database'

interface Props {
  suppliers: Supplier[]
}

export function QcpsComparisonChart({ suppliers }: Props) {
  const data = suppliers
    .filter(s => s.status === 'active')
    .map(s => ({
      name: s.name.length > 12 ? `${s.name.slice(0, 12)}…` : s.name,
      score: qcpsAverage(s),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Comparativo QCPS — fornecedores ativos</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${Number(v)}/10`, 'QCPS']} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.score >= 7 ? '#7c3aed' : entry.score >= 6 ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
