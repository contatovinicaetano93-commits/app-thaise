'use client'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { pendingSuppliersApi } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

export default function PendingSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    pendingSuppliersApi.list().then(setSuppliers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function review(id: string, action: 'approve' | 'reject') {
    try {
      await pendingSuppliersApi.review(id, action)
      toast.success(action === 'approve' ? 'Fornecedor homologado' : 'Fornecedor rejeitado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div>
      <PageFeedHeader
        title="Homologação"
        icon={Truck}
        subtitle="SIPOC: fornecedores pendentes aguardam curadoria (S)"
        menuItems={[{ label: 'Ver fornecedores', href: '/suppliers' }]}
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : suppliers.length === 0 ? (
        <PanelCard title="Nenhum fornecedor pendente" icon={Truck} padding="p-12" collapsible={false}>
          <p className="text-sm text-gray-500 text-center">Todos os fornecedores foram homologados.</p>
        </PanelCard>
      ) : (
        <div className="space-y-3">
          {suppliers.map(s => (
            <PanelCard
              key={s.id}
              title={s.name}
              rounded="rounded-xl"
              padding="p-5"
              menuItems={[
                { label: 'Aprovar', onClick: () => review(s.id, 'approve') },
                { label: 'Rejeitar', onClick: () => review(s.id, 'reject'), danger: true },
              ]}
            >
              <p className="text-sm text-gray-500">{s.category} · {s.contact_email}</p>
            </PanelCard>
          ))}
        </div>
      )}
    </div>
  )
}
