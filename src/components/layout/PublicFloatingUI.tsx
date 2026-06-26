'use client'

import { Portal } from '@/components/layout/Portal'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'

export function PublicFloatingUI() {
  return (
    <Portal>
      <WhatsAppButton stacked={false} />
    </Portal>
  )
}
