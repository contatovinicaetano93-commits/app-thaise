import { useState, useEffect, useCallback, useRef } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Refetch periódico quando a aba está visível (quase real-time sem WebSocket). */
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
