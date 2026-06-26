'use client'

import { LogoutButton } from '@/components/layout/LogoutButton'

export function AppLogoutBar() {
  return (
    <div className="fixed top-4 right-4 z-50 lg:absolute lg:top-6 lg:right-6">
      <LogoutButton variant="bar" />
    </div>
  )
}
