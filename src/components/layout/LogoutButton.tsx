'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type LogoutButtonProps = {
  variant?: 'icon' | 'full' | 'bar' | 'prominent'
  className?: string
}

export function LogoutButton({ variant = 'full', className = '' }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch {
        /* Supabase opcional em dev */
      }
      router.push('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className={`p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50 ${className}`}
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
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-md transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ${className}`}
      >
        <LogOut size={16} />
        {loading ? 'Saindo…' : 'Sair'}
      </button>
    )
  }

  if (variant === 'prominent') {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50 ${className}`}
      >
        <LogOut size={16} />
        <span>{loading ? 'Saindo…' : 'Sair · voltar ao login'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400 disabled:opacity-50 ${className}`}
    >
      <LogOut size={16} />
      {loading ? 'Saindo…' : 'Sair'}
    </button>
  )
}
