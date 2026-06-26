'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type RealtimeTable = 'clients' | 'products' | 'orders' | 'suppliers' | 'projects' | 'activity_events' | 'opportunities'

/** Recarrega dados quando o Supabase Realtime detecta mudança nas tabelas. */
export function useRealtimeRefresh(tables: RealtimeTable[], onRefresh: () => void) {
  const callbackRef = useRef(onRefresh)
  useEffect(() => { callbackRef.current = onRefresh }, [onRefresh])

  const tablesKey = tables.join(',')

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      return
    }

    const channel = supabase.channel(`sync:${tablesKey}`)

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => callbackRef.current(),
      )
    }

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tablesKey])
}
