'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export type PanelPriority = 'critical' | 'primary' | 'secondary'

const STORAGE_PREFIX = 'thaise:panel-state:'
export const PANEL_STATE_EVENT = 'thaise:panel-state-changed'

export function defaultOpenForPriority(priority: PanelPriority): boolean {
  return priority !== 'secondary'
}

function readPageState(pathname: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + pathname)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

function writePageState(pathname: string, state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + pathname, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

function persistSectionOpen(pathname: string, sectionId: string, open: boolean) {
  const current = readPageState(pathname)
  current[sectionId] = open
  writePageState(pathname, current)
}

function resolveOpen(
  pathname: string,
  sectionId: string,
  priority: PanelPriority,
  defaultOpenOverride?: boolean,
): boolean {
  const stored = readPageState(pathname)
  if (sectionId in stored) return stored[sectionId]!
  return defaultOpenOverride ?? defaultOpenForPriority(priority)
}

export function usePanelSection(
  sectionId: string | undefined,
  priority: PanelPriority,
  defaultOpenOverride?: boolean,
) {
  const pathname = usePathname()
  const fallback = defaultOpenOverride ?? defaultOpenForPriority(priority)
  const [open, setOpen] = useState(fallback)

  const syncFromStorage = useCallback(() => {
    if (!sectionId) return
    setOpen(resolveOpen(pathname, sectionId, priority, defaultOpenOverride))
  }, [pathname, sectionId, priority, defaultOpenOverride])

  useEffect(() => {
    if (sectionId) syncFromStorage()
  }, [sectionId, syncFromStorage])

  useEffect(() => {
    if (!sectionId) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ pathname: string }>).detail
      if (detail?.pathname === pathname) syncFromStorage()
    }
    window.addEventListener(PANEL_STATE_EVENT, handler)
    return () => window.removeEventListener(PANEL_STATE_EVENT, handler)
  }, [pathname, sectionId, syncFromStorage])

  const toggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev
      if (sectionId) persistSectionOpen(pathname, sectionId, next)
      return next
    })
  }, [pathname, sectionId])

  const set = useCallback(
    (value: boolean) => {
      setOpen(value)
      if (sectionId) persistSectionOpen(pathname, sectionId, value)
    },
    [pathname, sectionId],
  )

  return { open, toggle, set }
}

export function usePanelToolbar(sections: { id: string; priority: PanelPriority }[]) {
  const pathname = usePathname()

  const broadcast = useCallback(() => {
    window.dispatchEvent(new CustomEvent(PANEL_STATE_EVENT, { detail: { pathname } }))
  }, [pathname])

  const expandAll = useCallback(() => {
    const state = readPageState(pathname)
    for (const s of sections) state[s.id] = true
    writePageState(pathname, state)
    broadcast()
  }, [pathname, sections, broadcast])

  const collapseSecondary = useCallback(() => {
    const state = readPageState(pathname)
    for (const s of sections) {
      state[s.id] = s.priority !== 'secondary'
    }
    writePageState(pathname, state)
    broadcast()
  }, [pathname, sections, broadcast])

  const collapseAll = useCallback(() => {
    const state = readPageState(pathname)
    for (const s of sections) state[s.id] = false
    writePageState(pathname, state)
    broadcast()
  }, [pathname, sections, broadcast])

  return { expandAll, collapseSecondary, collapseAll }
}
