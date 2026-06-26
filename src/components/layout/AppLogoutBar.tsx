'use client'

import { LogoutButton } from '@/components/layout/LogoutButton'

export function AppLogoutBar() {
  return (
    <div className="fixed top-4 right-4 z-[60]">
      <LogoutButton variant="bar" />
    </div>
  )
}
