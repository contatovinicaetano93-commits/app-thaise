'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Info } from 'lucide-react'
import { PanelCard } from '@/components/ui/PanelCard'
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
        <PanelCard
          key={i}
          panelId={`alert-${i}`}
          title={a.severity === 'warning' ? 'Alerta' : 'Informação'}
          icon={a.severity === 'warning' ? AlertTriangle : Info}
          iconClassName={a.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}
          defaultOpen={false}
          summary={a.message}
          className={a.severity === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}
          menuItems={a.href ? [{ label: 'Ver detalhes', href: a.href }] : undefined}
        >
          {a.href ? (
            <Link href={a.href} className="text-sm hover:underline">{a.message}</Link>
          ) : (
            <span className="text-sm">{a.message}</span>
          )}
        </PanelCard>
      ))}
    </div>
  )
}
