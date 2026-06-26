'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

type LogoutButtonProps = {
  variant?: 'icon' | 'full' | 'bar'
  className?: string
}

export function LogoutButton({ variant = 'full', className = '' }: LogoutButtonProps) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={logout}
        className={`p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ${className}`}
        aria-label="Sair"
      >
        <LogOut size={16} />
      </button>
    )
  }

  if (variant === 'bar') {
    return (
      <button
        type="button"
        onClick={logout}
        className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${className}`}
      >
        <LogOut size={16} />
        Sair
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400 ${className}`}
    >
      <LogOut size={16} />
      Sair
    </button>
  )
}
