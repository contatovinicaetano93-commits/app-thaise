'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ClipboardList, Plus, Check, X, Ban } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { SkuRequestForm } from '@/components/sku/SkuRequestForm'
import { ProductForm } from '@/components/products/ProductForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
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

export default function SkuRequestsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} height="h-20" />}>
      <SkuRequestsPageContent />
    </Suspense>
  )
}

function SkuRequestsPageContent() {
  const router = useRouter()
  const { isGestor, role } = useAuth()
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<SkuRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [fillRequest, setFillRequest] = useState<SkuRequest | undefined>()
  const [acting, setActing] = useState<string | null>(null)

  const defaultProjectId = searchParams.get('project_id') ?? undefined
  const defaultSupplierId = searchParams.get('supplier_id') ?? undefined
  const statusFilter = searchParams.get('status') ?? undefined

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRequests(await skuRequestsApi.list(statusFilter ? { status: statusFilter } : undefined))
    } catch {
      toast.error('Erro ao carregar pedidos de SKU')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (isGestor) {
      const q = new URLSearchParams(searchParams.toString())
      q.set('tab', 'skus')
      router.replace(`/products?${q.toString()}`)
    }
  }, [isGestor, router, searchParams])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['products'])

  if (isGestor) {
    return <ListSkeleton rows={4} height="h-20" />
  }

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

  const openCount = requests.filter(r => r.status === 'open').length
  const pendingCount = requests.filter(r => r.status === 'submitted').length
  // Esta página é só do fornecedor (gestor é redirecionado) — nunca use copy de gestora.
  const labelRole = 'fornecedor' as const

  return (
    <div>
      <PageFeedHeader
        title={isGestor ? 'SKUs pedidos' : 'SKUs solicitados'}
        subtitle={
          isGestor
            ? `${requests.length} pedido(s) · ${pendingCount} aguardando aprovação`
            : `${openCount} aguardando seu cadastro`
        }
        menuItems={isGestor ? [{ label: 'Novo pedido de SKU', onClick: () => setCreateOpen(true) }] : undefined}
      />

      {isGestor && (
        <p className="text-sm text-violet-900 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-4">
          Peça ao fornecedor homologado que cadastre o SKU. Quando ele enviar, você <strong>aprova</strong> para entrar no catálogo da obra.
        </p>
      )}

      {role === 'fornecedor' && (
        <p className="text-sm text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
          A Estlar solicita os SKUs abaixo. Cadastre preço e detalhes — após envio, aguarda aprovação antes de ir ao catálogo.
        </p>
      )}

      {isGestor && (
        <div className="mb-4">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Pedir SKU ao fornecedor
          </Button>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} height="h-20" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
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
              summary={[
                req.project?.name,
                req.supplier?.name,
                skuRequestStatusLabel(req.status, labelRole),
              ].filter(Boolean).join(' · ')}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status] ?? 'bg-gray-100'}`}>
                  {skuRequestStatusLabel(req.status, labelRole)}
                </span>
              }
            >
              <dl className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                <div><dt className="text-gray-400 text-xs">Obra</dt><dd className="font-medium">{req.project?.name ?? '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs">Fornecedor</dt><dd className="font-medium">{req.supplier?.name ?? '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs">Categoria / unidade</dt><dd>{req.category} · {req.unit}</dd></div>
                {req.quantity_estimated && (
                  <div><dt className="text-gray-400 text-xs">Qtd. estimada</dt><dd>{req.quantity_estimated}</dd></div>
                )}
                {req.due_date && (
                  <div><dt className="text-gray-400 text-xs">Prazo</dt><dd>{new Date(req.due_date).toLocaleDateString('pt-BR')}</dd></div>
                )}
              </dl>
              {req.notes && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">{req.notes}</p>}

              {req.product && (
                <div className="rounded-lg border border-gray-100 bg-white p-3 mb-3 text-sm">
                  <p className="font-medium text-gray-900">{req.product.name}</p>
                  <p className="text-gray-500 mt-1">
                    {req.product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{req.product.unit}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {role === 'fornecedor' && (req.status === 'open' || req.status === 'rejected') && (
                  <Button onClick={() => setFillRequest(req)}>
                    <Plus size={14} /> {req.status === 'rejected' ? 'Reenviar SKU' : 'Cadastrar SKU'}
                  </Button>
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
                    <Ban size={14} /> Cancelar pedido
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
    </div>
  )
}
