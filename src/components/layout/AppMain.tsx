'use client'

import { useState } from 'react'
import { AppLogoutBar } from '@/components/layout/AppLogoutBar'
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { AssistantPanel } from '@/components/ui/AssistantPanel'

export function AppMain({ children }: { children: React.ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false)

  return (
    <>
      <AppLogoutBar />
      <KeyboardShortcuts />
      <CommandPalette />
      <div
        className={[
          'max-w-6xl mx-auto pl-4 lg:pl-6 py-6 lg:py-8 pt-16 lg:pt-8 pb-24',
          // FAB: right-6 (1.5rem) + w-12 (3rem) ≈ 4.5rem; pr-20 (5rem) clears it without the old pr-28 excess
          assistantOpen ? 'pr-4 lg:pr-[21.5rem]' : 'pr-20',
        ].join(' ')}
      >
        {children}
      </div>
      <AssistantPanel open={assistantOpen} onOpenChange={setAssistantOpen} />
    </>
  )
}
