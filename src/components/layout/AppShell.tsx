'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { AppLogoutBar } from '@/components/layout/AppLogoutBar'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { AssistantPanel } from '@/components/ui/AssistantPanel'
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { Portal } from '@/components/layout/Portal'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false)

  return (
    <>
      <div className="flex h-full min-h-screen">
        <MobileSidebar />
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="relative flex-1 overflow-auto">
          <KeyboardShortcuts />
          <CommandPalette />
          <div
            className={[
              'max-w-6xl mx-auto pl-4 lg:pl-6 py-6 lg:py-8 pt-20 lg:pt-16 pb-32',
              assistantOpen ? 'pr-4 lg:pr-[21.5rem]' : 'pr-28',
            ].join(' ')}
          >
            {children}
          </div>
        </main>
      </div>

      <Portal>
        <AppLogoutBar />
        <WhatsAppButton assistantOpen={assistantOpen} />
        <AssistantPanel open={assistantOpen} onOpenChange={setAssistantOpen} />
      </Portal>
    </>
  )
}
