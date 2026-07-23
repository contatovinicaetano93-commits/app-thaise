'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, ExternalLink, Phone, Mail } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { QcpsBar } from '@/components/ui/QcpsBar'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { homologationTierLabel, qcpsAverage } from '@/lib/qcps'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { suppliersApi, pendingSuppliersApi } from '@/lib/api'
import { useDebounce, useLiveRefresh } from '@/lib/hooks'
import { PageTabs } from '@/components/ui/PageTabs'
import { PendingSuppliersPanel } from '@/components/suppliers/PendingSuppliersPanel'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'
import { inviteUserUrl, productCreateUrl } from '@/lib/flow-links'

const STATUS_LABEL: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' }
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} height="h-28" />}>
      <SuppliersPageContent />
    </Suspense>
  )
}

function SuppliersPageContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'ativos'
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()
  const [deleting, setDeleting] = useState<Supplier | undefined>()

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [data, pending] = await Promise.all([
        suppliersApi.list(),
        pendingSuppliersApi.list().catch(() => []),
      ])
      setSuppliers(data)
      setPendingCount(pending.length)
    } catch {
      if (!silent) toast.error('Erro ao carregar fornecedores')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['suppliers'])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(undefined)
      setModalOpen(true)
    }
  }, [searchParams])

  async function handleDelete() {
    if (!deleting) return
    try {
      await suppliersApi.remove(deleting.id)
      toast.success('Fornecedor removido')
      setDeleting(undefined)
      load()
    } catch {
      toast.error('Erro ao excluir fornecedor')
    }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div>
      <PageFeedHeader
        title="Fornecedores"
        subtitle={
          tab === 'homologacao'
            ? `${pendingCount} aguardando homologação`
            : `${suppliers.length} cadastrado${suppliers.length !== 1 ? 's' : ''}`
        }
        menuItems={[
          { label: 'Novo fornecedor', onClick: () => { setEditing(undefined); setModalOpen(true) } },
        ]}
      />

      <PageTabs
        tabs={[
          { id: 'ativos', label: 'Homologados' },
          { id: 'homologacao', label: 'Homologação', badge: pendingCount },
        ]}
      />

      {tab === 'homologacao' ? (
        <PendingSuppliersPanel />
      ) : (
      <>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {!loading && filtered.length > 0 && (
        <PanelToolbar
          sections={filtered.map(s => ({ id: `supplier-${s.id}`, priority: 'secondary' as const }))}
          className="mb-2"
        />
      )}

      {loading ? (
        <ListSkeleton rows={3} height="h-28" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Plus}
          iconClass="text-indigo-600"
          title={search ? 'Nenhum resultado' : 'Nenhum fornecedor ainda'}
          description={search ? 'Tente outro termo.' : 'Adicione seu primeiro fornecedor curado.'}
          actionLabel={search ? undefined : 'Novo Fornecedor'}
          onAction={search ? undefined : () => { setEditing(undefined); setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(supplier => (
            <PanelCard
              key={supplier.id}
              panelId={`supplier-${supplier.id}`}
              title={supplier.name}
              defaultOpen={false}
              summary={`${supplier.category} · QCPS ${qcpsAverage(supplier)}${supplier.homologation_tier ? ` · ${homologationTierLabel(supplier.homologation_tier)}` : ''} · ${STATUS_LABEL[supplier.status]}`}
              headerExtra={
                <>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[supplier.status]}`}>
                    {STATUS_LABEL[supplier.status]}
                  </span>
                  <span className="text-sm font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">
                    {qcpsAverage(supplier)}
                  </span>
                </>
              }
              menuItems={[
                ...(supplier.status === 'pending'
                  ? [{ label: 'Homologar', href: '/suppliers?tab=homologacao' }]
                  : supplier.status === 'active'
                    ? [
                        { label: 'Ver catálogo', href: `/products?supplier_id=${supplier.id}` },
                        { label: 'Cadastrar produto', href: productCreateUrl(supplier.id) },
                        { label: 'Convidar ao portal', href: inviteUserUrl({ role: 'fornecedor', supplierId: supplier.id }) },
                      ]
                    : []),
                { label: 'Editar', onClick: () => { setEditing(supplier); setModalOpen(true) } },
                { label: 'Excluir', onClick: () => setDeleting(supplier), danger: true },
              ]}
            >
              <p className="text-sm text-gray-500 mb-3">{supplier.category}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Phone size={13} />{supplier.contact_phone}</span>
                <span className="flex items-center gap-1"><Mail size={13} />{supplier.contact_email}</span>
                {supplier.website && (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                    <ExternalLink size={13} />Site
                  </a>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <QcpsBar scores={supplier} compact />
              </div>
            </PanelCard>
          ))}
        </div>
      )}
      </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'} size="lg">
        <SupplierForm
          supplier={editing}
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(undefined)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Tem certeza que deseja excluir <strong>{deleting?.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
