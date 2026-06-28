'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Package } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ProductForm } from '@/components/products/ProductForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { productsApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

export default function ProductsPage() {
  const { isGestor, role } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>()
  const [deleting, setDeleting] = useState<Product | undefined>()

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await productsApi.list()
      setProducts(data)
    } catch {
      if (!silent) toast.error('Erro ao carregar produtos')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['products'])

  async function handleDelete() {
    if (!deleting) return
    try {
      await fetch(`/api/products/${deleting.id}`, { method: 'DELETE', credentials: 'include' })
      toast.success('Produto removido')
      setDeleting(undefined)
      load()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageFeedHeader
        title="Catálogo"
        subtitle={`${products.length} produto${products.length !== 1 ? 's' : ''}`}
        menuItems={(isGestor || role === 'fornecedor') ? [
          { label: 'Novo produto', onClick: () => { setEditing(undefined); setModalOpen(true) } },
          ...(isGestor ? [{ label: 'Exportar CSV', onClick: () => productsApi.exportCsv().catch(() => toast.error('Erro ao exportar')) }] : []),
        ] : undefined}
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {!loading && filtered.length > 0 && (
        <PanelToolbar
          sections={filtered.map(p => ({ id: `product-${p.id}`, priority: 'secondary' as const }))}
          className="mb-2"
        />
      )}

      {loading ? (
        <ListSkeleton rows={6} height="h-36" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          iconClass="text-amber-600"
          title={search ? 'Nenhum resultado' : 'Catálogo vazio'}
          description={
            search
              ? 'Tente outro termo.'
              : role === 'fornecedor'
                ? 'Cadastre produtos do seu fornecedor para receber pedidos.'
                : 'Adicione produtos vinculados aos fornecedores.'
          }
          actionLabel={search || role === 'cliente' ? undefined : 'Novo Produto'}
          onAction={search || role === 'cliente' ? undefined : () => { setEditing(undefined); setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <PanelCard
              key={product.id}
              panelId={`product-${product.id}`}
              title={product.name}
              defaultOpen={false}
              summary={`${product.category} · ${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/${product.unit}`}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </span>
              }
              menuItems={[
                { label: 'Editar', onClick: () => { setEditing(product); setModalOpen(true) } },
                { label: 'Excluir', onClick: () => setDeleting(product), danger: true },
              ]}
            >
              <p className="text-xs text-gray-400 mb-3">{product.category}</p>
              <div className="pt-3 border-t border-gray-50">
                <span className="text-lg font-bold text-gray-900">
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-xs text-gray-400">/{product.unit}</span>
                {product.lead_time_days && (
                  <p className="text-xs text-gray-400 mt-0.5">{product.lead_time_days} dias prazo</p>
                )}
              </div>
              <ActivityTimeline entityType="product" entityId={product.id} />
            </PanelCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <ProductForm
          product={editing}
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(undefined)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-gray-600 mb-5">Remover <strong>{deleting?.name}</strong> do catálogo?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
