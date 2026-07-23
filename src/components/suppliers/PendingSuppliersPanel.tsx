'use client'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { pendingSuppliersApi } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { Button } from '@/components/ui/Button'
import { inviteUserUrl } from '@/lib/flow-links'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

export function PendingSuppliersPanel({ onCreateNew }: { onCreateNew?: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    pendingSuppliersApi.list().then(setSuppliers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function review(id: string, action: 'approve' | 'reject') {
    try {
      const result = await pendingSuppliersApi.review(id, action)
      if (action === 'approve') {
        toast.success('Fornecedor homologado')
        if (result.email?.sent) {
          toast.success(`E-mail enviado para ${result.contact_email}`)
        } else if (result.email) {
          toast.warning(result.email.error ?? 'E-mail de homologação não enviado', { duration: 8000 })
        }
      } else {
        toast.success('Fornecedor rejeitado')
      }
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  if (loading) return <ListSkeleton rows={3} height="h-14" />

  if (suppliers.length === 0) {
    return (
      <PanelCard
        panelId="pending-empty"
        title="Nenhum fornecedor pendente"
        icon={Truck}
        collapsible={false}
        summary="Todos homologados"
      >
        <p className="text-sm text-gray-500 text-center mb-3">
          Ninguém aguardando curadoria. Para cadastrar um novo já homologado:
        </p>
        {onCreateNew && (
          <div className="flex justify-center">
            <Button onClick={onCreateNew}>Homologar novo fornecedor</Button>
          </div>
        )}
      </PanelCard>
    )
  }

  return (
    <div className="space-y-2">
      <PanelToolbar sections={suppliers.map(s => ({ id: `pending-${s.id}`, priority: 'primary' as const }))} className="mb-2" />
      {suppliers.map(s => (
        <PanelCard
          key={s.id}
          panelId={`pending-${s.id}`}
          title={s.name}
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
            <a href={inviteUserUrl({ role: 'fornecedor', supplierId: s.id })} className="text-violet-600 hover:underline">
              convidar ao portal
            </a>
          </p>
        </PanelCard>
      ))}
    </div>
  )
}
