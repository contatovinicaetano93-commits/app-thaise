'use client'

import { useEffect, useState } from 'react'
import { Check, X, Truck } from 'lucide-react'
import { pendingSuppliersApi } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

export default function PendingSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    pendingSuppliersApi.list().then(setSuppliers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function review(id: string, action: 'approve' | 'reject') {
    try {
      await pendingSuppliersApi.review(id, action)
      toast.success(action === 'approve' ? 'Fornecedor homologado' : 'Fornecedor rejeitado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Homologação</h2>
        <p className="text-gray-500 mt-1 text-sm">SIPOC: fornecedores pendentes aguardam curadoria (S)</p>
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Truck size={24} className="text-violet-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nenhum fornecedor pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map(s => (
            <div key={s.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.category} · {s.contact_email}</p>
              </div>
              <div className="flex gap-2">
                <Button className="px-3 py-1.5 text-xs" onClick={() => review(s.id, 'approve')}><Check size={14} />Aprovar</Button>
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => review(s.id, 'reject')}><X size={14} />Rejeitar</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
