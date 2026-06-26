'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { activityApi, type ActivityEventRow } from '@/lib/api'
import { formatRelativeDate } from '@/lib/format'
import { useRealtimeRefresh, type RealtimeTable } from '@/lib/realtime'
import { PanelCard } from '@/components/ui/PanelCard'

const ENTITY_TABLE: Record<string, RealtimeTable | undefined> = {
  client: 'clients',
  product: 'products',
  order: 'orders',
  supplier: 'suppliers',
  project: 'projects',
}

export function ActivityTimeline({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [events, setEvents] = useState<ActivityEventRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(() => {
    activityApi.list(entityType, entityId)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const table = ENTITY_TABLE[entityType]
  useRealtimeRefresh(
    table ? [table, 'activity_events'] : [],
    fetchEvents,
  )

  if (loading) return <div className="h-16 bg-gray-50 rounded-lg animate-pulse mt-4" />
  if (events.length === 0) return null

  return (
    <PanelCard
      className="mt-4 border-gray-50"
      title="Memória / Timeline"
      icon={Clock}
      padding="p-4"
      defaultOpen={false}
      menuItems={[{ label: 'Atualizar', onClick: fetchEvents }]}
    >
      <div className="space-y-2 pl-2 border-l-2 border-violet-100">
        {events.map(e => (
          <div key={e.id} className="pl-3 -ml-0.5">
            <p className="text-sm text-gray-800">{e.title}</p>
            {e.detail && <p className="text-xs text-gray-400">{e.detail}</p>}
            <p className="text-xs text-gray-300 mt-0.5">{formatRelativeDate(e.created_at)}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  )
}
