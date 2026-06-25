'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { activityApi, type ActivityEventRow } from '@/lib/api'
import { formatRelativeDate } from '@/lib/format'
import { useRealtimeRefresh, type RealtimeTable } from '@/lib/realtime'

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

  if (loading) return <div className="h-16 bg-gray-50 rounded-lg animate-pulse mt-3" />
  if (events.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-gray-400" />
        <h4 className="text-xs font-semibold text-gray-500 uppercase">Memória / Timeline</h4>
      </div>
      <div className="space-y-2 pl-2 border-l-2 border-violet-100">
        {events.map(e => (
          <div key={e.id} className="pl-3 -ml-0.5">
            <p className="text-sm text-gray-800">{e.title}</p>
            {e.detail && <p className="text-xs text-gray-400">{e.detail}</p>}
            <p className="text-xs text-gray-300 mt-0.5">{formatRelativeDate(e.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
