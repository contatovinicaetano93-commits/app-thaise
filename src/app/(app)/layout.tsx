export const dynamic = 'force-dynamic'

import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { AppLogoutBar } from '@/components/layout/AppLogoutBar'
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { AssistantPanel } from '@/components/ui/AssistantPanel'
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
          <AppLogoutBar />
          <KeyboardShortcuts />
          <CommandPalette />
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8 pt-16 lg:pt-8 pr-28 lg:pr-6">
            {children}
          </div>
          <AssistantPanel />
        </main>
      </div>
    </AuthProvider>
  )
}
