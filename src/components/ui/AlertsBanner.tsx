'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Info } from 'lucide-react'
import { alertsApi, type AlertRow } from '@/lib/api'

export function AlertsBanner() {
  const [alerts, setAlerts] = useState<AlertRow[]>([])

  useEffect(() => {
    alertsApi.list().then(setAlerts).catch(() => {})
  }, [])

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {alerts.slice(0, 4).map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
            a.severity === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-blue-50 text-blue-800 border border-blue-100'
          }`}
        >
          {a.severity === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
          {a.href ? <Link href={a.href} className="hover:underline flex-1">{a.message}</Link> : <span>{a.message}</span>}
        </div>
      ))}
    </div>
  )
}
