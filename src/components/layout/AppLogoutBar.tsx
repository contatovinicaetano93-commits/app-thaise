'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { LogoutButton } from '@/components/layout/LogoutButton'
import { useAuth } from '@/components/auth/AuthProvider'

export function AppLogoutBar() {
  const { role } = useAuth()

  return (
    <div className="fixed top-4 right-4 z-[9998] flex items-center gap-2">
      {role && (
        <Link
          href="/notifications"
          className="p-2.5 rounded-xl bg-white/90 border border-gray-200 shadow-sm text-gray-600 hover:text-violet-700 hover:border-violet-200 transition-colors"
          title="Notificações"
        >
          <Bell size={18} />
        </Link>
      )}
      <LogoutButton variant="floating" />
    </div>
  )
}
