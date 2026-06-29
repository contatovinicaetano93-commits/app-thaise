'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Package, Plus, ShoppingCart } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ProductForm } from '@/components/products/ProductForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { productsApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { useAuth } from '@/components/auth/AuthProvider'
import { orderCreateUrl } from '@/lib/flow-links'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

export default function ProductsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} height="h-36" />}>
      <ProductsPageContent />
    </Suspense>
  )
}

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const { isGestor, role } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>()
  const [deleting, setDeleting] = useState<Product | undefined>()
  const defaultSupplierId = searchParams.get('supplier_id') ?? undefined

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      setProducts(await productsApi.list())
    } catch {
      if (!silent) toast.error('Erro ao carregar produtos')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['products'])

  useEffect(() => {
    if (searchParams.get('new') === '1' && role === 'fornecedor') {
      setEditing(undefined)
      setModalOpen(true)
    }
    if (defaultSupplierId) setSupplierFilter(defaultSupplierId)
  }, [searchParams, role, defaultSupplierId])

  const canEditCatalog = isGestor || role === 'fornecedor'

  async function handleDelete() {
    if (!deleting || !isGestor) return
    try {
      await productsApi.remove(deleting.id)
      toast.success('Produto removido')
      setDeleting(undefined)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const suppliers = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      if (!map.has(p.supplier_id)) {
        map.set(p.supplier_id, p.supplier?.name ?? 'Fornecedor')
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [products])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.supplier?.name ?? '').toLowerCase().includes(q)
    const matchesSupplier = !supplierFilter || p.supplier_id === supplierFilter
    return matchesSearch && matchesSupplier
  })

  const groupedBySupplier = useMemo(() => {
    if (!isGestor) return null
    const groups = new Map<string, { name: string; items: Product[] }>()
    for (const p of filtered) {
      const existing = groups.get(p.supplier_id)
      if (existing) existing.items.push(p)
      else groups.set(p.supplier_id, { name: p.supplier?.name ?? 'Fornecedor', items: [p] })
    }
    return [...groups.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name))
  }, [filtered, isGestor])

  function renderProductCard(product: Product) {
    return (
      <PanelCard
        key={product.id}
        panelId={`product-${product.id}`}
        title={product.name}
        defaultOpen={false}
        summary={[
          isGestor && product.supplier?.name,
          product.category,
          `${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/${product.unit}`,
        ].filter(Boolean).join(' · ')}
        headerExtra={
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {product.active ? 'Ativo' : 'Inativo'}
          </span>
        }
        menuItems={isGestor ? [
          { label: 'Criar pedido', href: orderCreateUrl({ supplierId: product.supplier_id }) },
          { label: 'Editar', onClick: () => { setEditing(product); setModalOpen(true) } },
          { label: 'Excluir', onClick: () => setDeleting(product), danger: true },
        ] : role === 'fornecedor' ? [
          { label: 'Editar', onClick: () => { setEditing(product); setModalOpen(true) } },
        ] : undefined}
      >
        {isGestor && product.supplier?.name && (
          <p className="text-xs font-medium text-indigo-700 mb-2">{product.supplier.name}</p>
        )}
        <p className="text-xs text-gray-400 mb-2">{product.category}</p>
        <div className="pt-2 border-t border-gray-50">
          <span className="text-lg font-bold text-gray-900">
            {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-xs text-gray-400">/{product.unit}</span>
          {product.lead_time_days != null && (
            <p className="text-xs text-gray-400 mt-0.5">{product.lead_time_days} dias prazo</p>
          )}
        </div>
        <ActivityTimeline entityType="product" entityId={product.id} />
      </PanelCard>
    )
  }

  const pageTitle = isGestor ? 'Catálogo curado' : 'Meu catálogo'
  const pageSubtitle = isGestor
    ? `${products.length} produto(s) de ${suppliers.length} fornecedor(es) homologado(s) — inputs para pedidos das obras`
    : `${products.length} produto${products.length !== 1 ? 's' : ''}`

  return (
    <div>
      <PageFeedHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        menuItems={canEditCatalog ? [
          ...(role === 'fornecedor' ? [{ label: 'Cadastrar produto', onClick: () => { setEditing(undefined); setModalOpen(true) } }] : []),
          ...(isGestor ? [
            { label: 'Novo pedido', href: '/orders?new=1' },
            { label: 'Cadastrar produto (gestora)', onClick: () => { setEditing(undefined); setModalOpen(true) } },
            { label: 'Exportar CSV', onClick: () => productsApi.exportCsv().catch(() => toast.error('Erro ao exportar')) },
          ] : []),
        ] : undefined}
      />

      {role === 'fornecedor' && (
        <p className="text-sm text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
          Cadastre os produtos da sua empresa. A Estlar usa este catálogo ao montar pedidos das obras — você não escolhe a obra; recebe o pedido em <strong>Meus pedidos</strong>.
        </p>
      )}

      {role === 'fornecedor' && (
        <div className="mb-4">
          <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
            <Plus size={16} /> Cadastrar produto
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isGestor ? 'Buscar produto, categoria ou fornecedor...' : 'Buscar por nome ou categoria...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
        {isGestor && suppliers.length > 0 && (
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[200px]"
          >
            <option value="">Todos os fornecedores</option>
            {suppliers.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={6} height="h-36" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          iconClass="text-amber-600"
          title={search || supplierFilter ? 'Nenhum resultado' : 'Catálogo vazio'}
          description={
            isGestor
              ? 'Homologue fornecedores, convide-os ao portal e aguarde o input de produtos — ou cadastre manualmente.'
              : role === 'fornecedor'
                ? 'Cadastre seus produtos para a Estlar montar pedidos das obras.'
                : 'Sem produtos visíveis.'
          }
          actionLabel={role === 'fornecedor' && !search ? 'Cadastrar produto' : undefined}
          onAction={role === 'fornecedor' && !search ? () => { setEditing(undefined); setModalOpen(true) } : undefined}
        />
      ) : isGestor && groupedBySupplier ? (
        <div className="space-y-6">
          {groupedBySupplier.map(([supplierId, group]) => (
            <section key={supplierId}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  {group.name}
                  <span className="text-gray-400 font-normal ml-2">{group.items.length} produto(s)</span>
                </h3>
                <Link
                  href={orderCreateUrl({ supplierId })}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900"
                >
                  <ShoppingCart size={14} /> Pedido com este fornecedor
                </Link>
              </div>
              <div className="space-y-2">{group.items.map(renderProductCard)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2">{filtered.map(renderProductCard)}</div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <ProductForm
          product={editing}
          defaultSupplierId={editing ? undefined : defaultSupplierId}
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
