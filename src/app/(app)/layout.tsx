export const dynamic = 'force-dynamic'

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { AppMain } from '@/components/layout/AppMain'
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-full min-h-screen">
        <MobileSidebar />
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="relative flex-1 overflow-auto">
          <AppMain>{children}</AppMain>
        </main>
      </div>
    </AuthProvider>
  )
}
