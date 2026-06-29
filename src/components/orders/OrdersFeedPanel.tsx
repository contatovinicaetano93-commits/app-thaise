'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { ordersApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { useAuth } from '@/components/auth/AuthProvider'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PanelCard } from '@/components/ui/PanelCard'
import { OrderNotificationsBadge } from '@/components/orders/OrderNotificationsBadge'
import { ORDER_STATUS_LABEL, allowedOrderTransitions, type OrderStatus } from '@/lib/orders/status-transitions'
import { isSimpleMode } from '@/lib/app-mode'
import { toast } from 'sonner'
import type { Order } from '@/types/database'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

interface Props {
  embedded?: boolean
}

export function OrdersFeedPanel({ embedded }: Props) {
  const { isGestor, role } = useAuth()
  const simple = isSimpleMode()
  const [orders, setOrders] = useState<Order[]>([])
  const [notifications, setNotifications] = useState<Record<string, Array<{
    order_id: string
    channel: 'whatsapp' | 'email' | 'in_app'
    status: 'sent' | 'failed' | 'stub'
    recipient: string | null
    error: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ordersApi.list()
      setOrders(data)
      if (isGestor) {
        ordersApi.notifications().then(setNotifications).catch(() => {})
      }
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [isGestor])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['orders'])

  async function updateStatus(id: string, status: string) {
    try {
      const updated = await ordersApi.updateStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o))
      toast.success(`Status: ${ORDER_STATUS_LABEL[updated.status as OrderStatus]}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  if (loading) return <ListSkeleton rows={embedded ? 3 : 4} />

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        iconClass="text-rose-600"
        title="Nenhum pedido ainda"
        description={
          simple && isGestor
            ? 'Pedidos aparecem aqui após o cliente aprovar o orçamento e você clicar em Gerar pedidos.'
            : 'Nenhum pedido registrado.'
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      {embedded && simple && isGestor && (
        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-2">
          Pedidos gerados a partir de orçamentos aprovados. Fornecedor é notificado para separar o produto.
        </p>
      )}
      {orders.map(order => (
        <PanelCard
          key={order.id}
          panelId={`order-${order.id}`}
          title={order.client?.name ?? 'Pedido'}
          summary={`${order.supplier?.name ?? '—'} · ${(order.total_price ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · ${ORDER_STATUS_LABEL[order.status as OrderStatus]}`}
          headerExtra={
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
              {ORDER_STATUS_LABEL[order.status as OrderStatus]}
            </span>
          }
          menuItems={
            role && role !== 'cliente'
              ? allowedOrderTransitions(role, order.status as OrderStatus).map(next => ({
                  label: `Marcar como ${ORDER_STATUS_LABEL[next]}`,
                  onClick: () => updateStatus(order.id, next),
                }))
              : undefined
          }
        >
          <p className="text-sm text-gray-500">
            {order.product?.name} · {order.quantity} {order.product?.unit}
            {order.project && ` · ${order.project.name}`}
          </p>
          {isGestor && <OrderNotificationsBadge notifications={notifications[order.id]} />}
        </PanelCard>
      ))}
    </div>
  )
}
