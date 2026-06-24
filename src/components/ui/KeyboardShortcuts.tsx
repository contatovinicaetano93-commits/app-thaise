'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+K → foca qualquer input de busca na página
      if (meta && e.key === 'k') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')
        input?.focus()
      }

      // Cmd+1–6 → navega entre seções
      if (meta && e.key === '1') { e.preventDefault(); router.push('/dashboard') }
      if (meta && e.key === '2') { e.preventDefault(); router.push('/projects') }
      if (meta && e.key === '3') { e.preventDefault(); router.push('/suppliers') }
      if (meta && e.key === '4') { e.preventDefault(); router.push('/clients') }
      if (meta && e.key === '5') { e.preventDefault(); router.push('/products') }
      if (meta && e.key === '6') { e.preventDefault(); router.push('/orders') }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  return null
}
