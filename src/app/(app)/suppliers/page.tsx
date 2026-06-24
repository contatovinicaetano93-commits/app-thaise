'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ExternalLink, Phone, Mail, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { QcpsBar } from '@/components/ui/QcpsBar'
import { qcpsAverage } from '@/lib/qcps'
import { Button } from '@/components/ui/Button'
import { suppliersApi } from '@/lib/api'
import { useDebounce } from '@/lib/hooks'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

const STATUS_LABEL: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' }
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()
  const [deleting, setDeleting] = useState<Supplier | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await suppliersApi.list()
      setSuppliers(data)
    } catch {
      toast.error('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fornecedores</h2>
          <p className="text-gray-500 mt-1">{suppliers.length} cadastrado{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
          <Plus size={16} />Novo Fornecedor
        </Button>
      </div>

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

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus size={20} className="text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {search ? 'Nenhum resultado' : 'Nenhum fornecedor ainda'}
          </h3>
          <p className="text-sm text-gray-500">
            {search ? 'Tente outro termo.' : 'Adicione seu primeiro fornecedor curado.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(supplier => (
            <div key={supplier.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[supplier.status]}`}>
                      {STATUS_LABEL[supplier.status]}
                    </span>
                  </div>
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
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">
                    {qcpsAverage(supplier)}
                  </span>
                  <button onClick={() => { setEditing(supplier); setModalOpen(true) }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleting(supplier)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <QcpsBar scores={supplier} compact />
              </div>
            </div>
          ))}
        </div>
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
