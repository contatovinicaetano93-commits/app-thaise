'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Check, X, Ban } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { SkuRequestForm } from '@/components/sku/SkuRequestForm'
import { ProductForm } from '@/components/products/ProductForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { skuRequestsApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { toast } from 'sonner'
import type { SkuRequest } from '@/types/database'
import { skuRequestStatusLabel } from '@/lib/sku-request-labels'

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  submitted: 'bg-violet-100 text-violet-800',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

interface Props {
  defaultProjectId?: string
  defaultSupplierId?: string
  autoOpenCreate?: boolean
}

export function SkuRequestsPanel({ defaultProjectId, defaultSupplierId, autoOpenCreate }: Props) {
  const { isGestor, role } = useAuth()
  const [requests, setRequests] = useState<SkuRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [fillRequest, setFillRequest] = useState<SkuRequest | undefined>()
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRequests(await skuRequestsApi.list())
    } catch {
      toast.error('Erro ao carregar pedidos de SKU')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['products'])

  useEffect(() => {
    if (autoOpenCreate && isGestor) setCreateOpen(true)
  }, [autoOpenCreate, isGestor])

  async function handleAction(id: string, action: 'approve' | 'reject' | 'cancel') {
    setActing(id)
    try {
      await skuRequestsApi.action(id, action)
      toast.success(action === 'approve' ? 'SKU aprovado' : action === 'reject' ? 'SKU rejeitado' : 'Pedido cancelado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na ação')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <ListSkeleton rows={4} height="h-20" />

  return (
    <>
      {isGestor && (
        <div className="mb-4">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Pedir SKU ao fornecedor
          </Button>
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          icon={Plus}
          iconClass="text-violet-600"
          title="Nenhum pedido de SKU"
          description={
            isGestor
              ? 'Crie um pedido vinculando obra + fornecedor homologado.'
              : 'Quando a Estlar pedir um SKU, ele aparecerá aqui.'
          }
          actionLabel={isGestor ? 'Pedir SKU' : undefined}
          onAction={isGestor ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {requests.map(req => (
            <PanelCard
              key={req.id}
              panelId={`sku-${req.id}`}
              title={req.name}
              defaultOpen={req.status === 'submitted' && isGestor}
              summary={[req.project?.name, req.supplier?.name, skuRequestStatusLabel(req.status, role)].filter(Boolean).join(' · ')}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status] ?? 'bg-gray-100'}`}>
                  {skuRequestStatusLabel(req.status, role)}
                </span>
              }
            >
              <dl className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                <div><dt className="text-gray-400 text-xs">Obra</dt><dd className="font-medium">{req.project?.name ?? '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs">Fornecedor</dt><dd className="font-medium">{req.supplier?.name ?? '—'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {role === 'fornecedor' && req.status === 'open' && (
                  <Button onClick={() => setFillRequest(req)}><Plus size={14} /> Cadastrar SKU</Button>
                )}
                {isGestor && req.status === 'submitted' && (
                  <>
                    <Button onClick={() => handleAction(req.id, 'approve')} loading={acting === req.id}>
                      <Check size={14} /> Aprovar no catálogo
                    </Button>
                    <Button variant="secondary" onClick={() => handleAction(req.id, 'reject')} disabled={acting === req.id}>
                      <X size={14} /> Rejeitar
                    </Button>
                  </>
                )}
                {isGestor && ['open', 'submitted'].includes(req.status) && (
                  <Button variant="secondary" onClick={() => handleAction(req.id, 'cancel')} disabled={acting === req.id}>
                    <Ban size={14} /> Cancelar
                  </Button>
                )}
              </div>
            </PanelCard>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Pedir SKU ao fornecedor" size="lg">
        <SkuRequestForm
          defaultProjectId={defaultProjectId}
          defaultSupplierId={defaultSupplierId}
          onSuccess={() => { setCreateOpen(false); load() }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={!!fillRequest} onClose={() => setFillRequest(undefined)} title="Cadastrar SKU solicitado" size="lg">
        {fillRequest && (
          <ProductForm
            skuRequest={fillRequest}
            onSuccess={() => { setFillRequest(undefined); load() }}
            onCancel={() => setFillRequest(undefined)}
          />
        )}
      </Modal>
    </>
  )
}
