'use client'

import { LogoutButton } from '@/components/layout/LogoutButton'

export function AppLogoutBar() {
  return (
    <div className="fixed top-4 right-4 z-[9998]">
      <LogoutButton variant="floating" />
    </div>
  )
}
