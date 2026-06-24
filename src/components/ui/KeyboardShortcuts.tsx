'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Atalhos de navegação — busca global em CommandPalette (⌘K) */
export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return

      if (e.key === '1') { e.preventDefault(); router.push('/dashboard') }
      if (e.key === '2') { e.preventDefault(); router.push('/projects') }
      if (e.key === '3') { e.preventDefault(); router.push('/suppliers') }
      if (e.key === '4') { e.preventDefault(); router.push('/clients') }
      if (e.key === '5') { e.preventDefault(); router.push('/products') }
      if (e.key === '6') { e.preventDefault(); router.push('/orders') }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  return null
}
