'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Phone, Mail, Building2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ClientForm } from '@/components/clients/ClientForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { clientsApi } from '@/lib/api'
import { useDebounce, useLiveRefresh } from '@/lib/hooks'
import { toast } from 'sonner'
import type { Client } from '@/types/database'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | undefined>()
  const [deleting, setDeleting] = useState<Client | undefined>()
  const debouncedSearch = useDebounce(search)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await clientsApi.list()
      setClients(data)
    } catch {
      if (!silent) toast.error('Erro ao carregar clientes')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['clients'])

  async function handleDelete() {
    if (!deleting) return
    try {
      await clientsApi.remove(deleting.id)
      toast.success('Cliente removido')
      setDeleting(undefined)
      load()
    } catch {
      toast.error('Erro ao excluir cliente')
    }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-500 mt-1 text-sm">{clients.length} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
          <Plus size={16} />Novo Cliente
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Plus}
          iconClass="text-emerald-600"
          title={search ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
          description={search ? 'Tente outro termo.' : 'Adicione seu primeiro cliente.'}
          actionLabel={search ? undefined : 'Novo Cliente'}
          onAction={search ? undefined : () => { setEditing(undefined); setModalOpen(true) }}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map(client => (
            <PanelCard
              key={client.id}
              title={client.name}
              padding="p-5"
              className="hover:shadow-md transition-shadow"
              headerExtra={client.segment && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                  {client.segment}
                </span>
              )}
              menuItems={[
                { label: 'Editar', onClick: () => { setEditing(client); setModalOpen(true) } },
                { label: 'Excluir', onClick: () => setDeleting(client), danger: true },
              ]}
            >
              {client.company && (
                <p className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <Building2 size={13} />{client.company}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Phone size={13} />{client.phone}</span>
                <span className="flex items-center gap-1"><Mail size={13} />{client.email}</span>
              </div>
              <ActivityTimeline entityType="client" entityId={client.id} />
            </PanelCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'}>
        <ClientForm
          client={editing}
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(undefined)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Remover <strong>{deleting?.name}</strong> permanentemente?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
