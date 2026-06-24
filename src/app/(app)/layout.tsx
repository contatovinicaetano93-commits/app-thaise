export const dynamic = 'force-dynamic'

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts'
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-full min-h-screen">
        <MobileSidebar />
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <KeyboardShortcuts />
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8 pt-16 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
