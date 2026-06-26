export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
