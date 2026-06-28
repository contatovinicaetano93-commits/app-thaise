'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ShoppingCart } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { OrderForm } from '@/components/orders/OrderForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { ordersApi } from '@/lib/api'
import { useDebounce, useLiveRefresh } from '@/lib/hooks'
import { useAuth } from '@/components/auth/AuthProvider'
import { SipocBadge } from '@/components/ui/SipocBadge'
import { toast } from 'sonner'
import type { Order } from '@/types/database'

import { allowedOrderTransitions, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/orders/status-transitions'
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const { isGestor, role } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const debouncedSearch = useDebounce(search)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await ordersApi.list()
      setOrders(data)
    } catch {
      if (!silent) toast.error('Erro ao carregar pedidos')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['orders'])

  async function updateStatus(id: string, status: string) {
    try {
      const updated = await ordersApi.updateStatus(id, status)
      const nextStatus = updated.status as OrderStatus
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o))
      toast.success(`Status: ${ORDER_STATUS_LABEL[nextStatus]}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status')
    }
  }

  function statusMenuItems(order: Order) {
    if (!role || role === 'cliente') return undefined
    const current = order.status as OrderStatus
    const allowed = allowedOrderTransitions(role, current)
    if (allowed.length === 0) return undefined
    return allowed.map(next => ({
      label: `Marcar como ${ORDER_STATUS_LABEL[next]}`,
      onClick: () => updateStatus(order.id, next),
    }))
  }

  const filtered = orders.filter(o =>
    (o.client?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (o.supplier?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (o.product?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (o.project?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const totalAberto = orders
    .filter(o => !['delivered', 'cancelled'].includes(o.status))
    .reduce((acc, o) => acc + (o.total_price ?? 0), 0)

  return (
    <div>
      <PageFeedHeader
        title="Pedidos"
        subtitle={
          <>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-violet-600 font-medium">
              {totalAberto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em aberto
            </span>
          </>
        }
        menuItems={isGestor ? [
          { label: 'Novo pedido', onClick: () => setModalOpen(true) },
          { label: 'Exportar CSV', onClick: () => ordersApi.exportCsv().catch(() => toast.error('Erro ao exportar')) },
        ] : [
          { label: 'Atualizar lista', onClick: () => load() },
        ]}
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por empreendimento, cliente, fornecedor ou produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {!loading && filtered.length > 0 && (
        <PanelToolbar
          sections={filtered.map(o => ({ id: `order-${o.id}`, priority: 'secondary' as const }))}
          className="mb-2"
        />
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          iconClass="text-rose-600"
          title={search ? 'Nenhum resultado' : 'Nenhum pedido ainda'}
          description={
            search
              ? 'Tente outro termo.'
              : isGestor
                ? 'Crie um pedido vinculando cliente, produto e fornecedor.'
                : role === 'fornecedor'
                  ? 'Quando o gestor aprovar pedidos, eles aparecerão aqui.'
                  : 'Seus pedidos aparecerão aqui quando forem criados pelo gestor.'
          }
          actionLabel={search || !isGestor ? undefined : 'Novo Pedido'}
          onAction={search || !isGestor ? undefined : () => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <PanelCard
              key={order.id}
              panelId={`order-${order.id}`}
              title={order.client?.name ?? 'Pedido'}
              defaultOpen={false}
              summary={`${order.supplier?.name ?? '—'} · ${(order.total_price ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · ${ORDER_STATUS_LABEL[order.status as OrderStatus]}`}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
                  {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                </span>
              }
              menuItems={statusMenuItems(order)}
            >
              <div className="flex items-center gap-2 mb-1">
                <SipocBadge />
                <span className="text-gray-300">→</span>
                <p className="text-sm text-gray-600">{order.supplier?.name}</p>
              </div>
              <p className="text-sm text-gray-500">
                {order.product?.name} · {order.quantity} {order.product?.unit}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {order.project && (
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                      {order.project.name} · Fase {order.project.phase}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="font-bold text-gray-900">
                  {(order.total_price ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </PanelCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Pedido" size="lg">
        <OrderForm
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
