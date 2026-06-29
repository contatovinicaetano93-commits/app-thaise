'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { isSimpleMode } from '@/lib/app-mode'
import { PendingSuppliersPanel } from '@/components/suppliers/PendingSuppliersPanel'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { Truck } from 'lucide-react'

export default function PendingSuppliersPage() {
  const router = useRouter()
  const simple = isSimpleMode()

  useEffect(() => {
    if (simple) {
      router.replace('/suppliers?tab=homologacao')
    }
  }, [simple, router])

  if (simple) {
    return <ListSkeleton rows={3} height="h-14" />
  }

  return (
    <div className="space-y-3">
      <PageFeedHeader
        title="Homologação"
        icon={Truck}
        subtitle="Só fornecedores homologados entram no catálogo e recebem pedidos de SKU"
        menuItems={[
          { label: 'Cadastrar fornecedor', href: '/suppliers?new=1' },
          { label: 'Catálogo', href: '/products' },
        ]}
      />
      <PendingSuppliersPanel />
    </div>
  )
}
