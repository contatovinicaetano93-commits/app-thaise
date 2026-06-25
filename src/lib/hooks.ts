import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useRealtimeRefresh, type RealtimeTable } from '@/lib/realtime'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Refetch periódico quando a aba está visível. */
export function usePolling(callback: () => void | Promise<void>, intervalMs = 30000, enabled = true) {
  const saved = useRef(callback)
  useEffect(() => { saved.current = callback }, [callback])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      if (document.visibilityState === 'hidden') return
      void saved.current()
    }

    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
}

/** Polling + Supabase Realtime para manter listas atualizadas. */
export function useLiveRefresh(
  load: (silent?: boolean) => void | Promise<void>,
  tables: RealtimeTable[],
  pollingMs = 30000,
) {
  const loadRef = useRef(load)
  useEffect(() => { loadRef.current = load }, [load])

  usePolling(() => loadRef.current(true), pollingMs)

  useRealtimeRefresh(tables, () => {
    void loadRef.current(true)
    toast.info('Dados atualizados', { duration: 2500, id: 'live-refresh' })
  })
}
