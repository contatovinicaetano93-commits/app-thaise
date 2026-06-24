'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ShoppingCart } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { OrderForm } from '@/components/orders/OrderForm'
import { Button } from '@/components/ui/Button'
import { ordersApi } from '@/lib/api'
import { useDebounce } from '@/lib/hooks'
import { toast } from 'sonner'
import type { Order } from '@/types/database'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovado', processing: 'Em produção',
  delivered: 'Entregue', cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const debouncedSearch = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ordersApi.list()
      setOrders(data)
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    try {
      await ordersApi.updateStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as Order['status'] } : o))
    } catch {
      toast.error('Erro ao atualizar status')
    }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-violet-600 font-medium">
              {totalAberto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em aberto
            </span>
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />Novo Pedido
        </Button>
      </div>

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

      {loading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart size={20} className="text-rose-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {search ? 'Nenhum resultado' : 'Nenhum pedido ainda'}
          </h3>
          <p className="text-sm text-gray-500">
            {search ? 'Tente outro termo.' : 'Crie um pedido vinculando cliente, produto e fornecedor.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{order.client?.name}</p>
                    <span className="text-gray-300">→</span>
                    <p className="text-sm text-gray-600">{order.supplier?.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {order.product?.name} · {order.quantity} {order.product?.unit}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {order.project && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        {order.project.name} · Fase {order.project.phase}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-bold text-gray-900">
                    {(order.total_price ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400 ${STATUS_COLOR[order.status]}`}
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
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
