'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'
import { pendingSuppliersApi } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { Button } from '@/components/ui/Button'
import { inviteUserUrl, productCreateUrl } from '@/lib/flow-links'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

export default function PendingSuppliersPage() {
  const router = useRouter()
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
      toast.success(action === 'approve' ? 'Fornecedor homologado — convide ao portal e aguarde catálogo' : 'Fornecedor rejeitado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  const panels = suppliers.map(s => ({ id: `pending-${s.id}`, priority: 'primary' as const }))

  return (
    <div className="space-y-3">
      <PageFeedHeader
        title="Homologação"
        icon={Truck}
        subtitle="Só fornecedores homologados entram no catálogo e recebem pedidos de SKU"
        menuItems={[
          { label: 'Cadastrar fornecedor', href: '/suppliers?new=1' },
          { label: 'Catálogo curado', href: '/products' },
        ]}
      />

      {panels.length > 0 && <PanelToolbar sections={panels} />}

      {loading ? (
        <ListSkeleton rows={3} height="h-14" />
      ) : suppliers.length === 0 ? (
        <PanelCard
          panelId="pending-empty"
          title="Nenhum fornecedor pendente"
          icon={Truck}
          collapsible={false}
          summary="Todos homologados — veja inputs em Catálogo curado"
        >
          <p className="text-sm text-gray-500 text-center mb-3">Nenhum fornecedor aguardando curadoria.</p>
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => router.push('/products')}>
              Ver catálogo curado
            </Button>
          </div>
        </PanelCard>
      ) : (
        <div className="space-y-2">
          {suppliers.map(s => (
            <PanelCard
              key={s.id}
              panelId={`pending-${s.id}`}
              title={s.name}
              defaultOpen={false}
              summary={`${s.category} · ${s.contact_email}`}
              badge="Pendente"
              menuItems={[
                { label: 'Aprovar', onClick: () => review(s.id, 'approve') },
                { label: 'Rejeitar', onClick: () => review(s.id, 'reject'), danger: true },
              ]}
            >
              <p className="text-sm text-gray-500">{s.category} · {s.contact_email}</p>
              <p className="text-xs text-gray-400 mt-1">{s.contact_phone}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button onClick={() => review(s.id, 'approve')}>Aprovar</Button>
                <Button variant="danger" onClick={() => review(s.id, 'reject')}>Rejeitar</Button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Após aprovar:{' '}
                <a href={inviteUserUrl({ role: 'fornecedor', supplierId: s.id })} className="text-violet-600 hover:underline">convidar ao portal</a>
                {' · '}
                <a href={productCreateUrl(s.id)} className="text-violet-600 hover:underline">cadastrar produto</a>
              </p>
            </PanelCard>
          ))}
        </div>
      )}
    </div>
  )
}
