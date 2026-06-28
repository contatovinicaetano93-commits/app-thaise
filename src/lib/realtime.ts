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
    if (tables.length === 0) return

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      return
    }

    let cancelled = false
    const channel = supabase.channel(`sync:${tablesKey}`)

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          if (cancelled) return
          try {
            callbackRef.current()
          } catch {
            // Evita propagar erros do callback para o client Realtime (Sentry)
          }
        },
      )
    }

    channel.subscribe((status, err) => {
      if (err && !cancelled) {
        console.warn('[realtime] subscribe error:', err.message)
      }
      if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !cancelled) {
        console.warn('[realtime] channel status:', status)
      }
    })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [tablesKey])
}
