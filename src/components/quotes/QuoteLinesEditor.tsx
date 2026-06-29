'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { productsApi, projectQuotesApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Product, ProjectQuote } from '@/types/database'

interface LineDraft {
  key: string
  product_id: string
  supplier_id: string
  name: string
  supplier_name: string
  unit: string
  quantity: number
  unit_price: number
  notes?: string
}

interface Props {
  quote: ProjectQuote
  onSaved: (quote: ProjectQuote) => void
}

export function QuoteLinesEditor({ quote, onSaved }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<LineDraft[]>([])
  const [addProductId, setAddProductId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    productsApi.list({ projectId: quote.project_id })
      .then(list => setProducts(list.filter(p => p.catalog_status === 'approved' && p.active)))
      .catch(() => toast.error('Erro ao carregar produtos da obra'))
  }, [quote.project_id])

  useEffect(() => {
    setLines((quote.lines ?? []).map(l => ({
      key: l.id,
      product_id: l.product_id,
      supplier_id: l.supplier_id,
      name: l.product?.name ?? '',
      supplier_name: l.supplier?.name ?? '',
      unit: l.product?.unit ?? 'un',
      quantity: l.quantity,
      unit_price: l.unit_price,
      notes: l.notes ?? undefined,
    })))
  }, [quote])

  function addLine() {
    const p = products.find(x => x.id === addProductId)
    if (!p) return
    if (lines.some(l => l.product_id === p.id)) {
      toast.error('Produto já está no orçamento')
      return
    }
    setLines(prev => [...prev, {
      key: `new-${p.id}`,
      product_id: p.id,
      supplier_id: p.supplier_id,
      name: p.name,
      supplier_name: p.supplier?.name ?? '',
      unit: p.unit,
      quantity: 1,
      unit_price: p.price,
    }])
    setAddProductId('')
  }

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)))
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(l => l.key !== key))
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)

  async function handleSave() {
    if (lines.length === 0) {
      toast.error('Adicione pelo menos um item')
      return
    }
    setSaving(true)
    try {
      const updated = await projectQuotesApi.saveLines(quote.id, lines.map(l => ({
        product_id: l.product_id,
        supplier_id: l.supplier_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        notes: l.notes ?? null,
      })))
      toast.success('Itens salvos')
      onSaved(updated)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const available = products.filter(p => !lines.some(l => l.product_id === p.id))

  return (
    <div className="space-y-4">
      {available.length > 0 ? (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Adicionar produto aprovado</label>
            <select
              value={addProductId}
              onChange={e => setAddProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Selecione...</option>
              {available.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.supplier?.name} ({p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="secondary" onClick={addLine} disabled={!addProductId}>
            <Plus size={14} /> Adicionar
          </Button>
        </div>
      ) : (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Nenhum produto aprovado disponível — peça SKUs e aprove no catálogo primeiro.
        </p>
      )}

      {lines.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Nenhum item no orçamento.</p>
      ) : (
        <div className="space-y-2">
          {lines.map(line => (
            <div key={line.key} className="grid grid-cols-12 gap-2 items-end border border-gray-100 rounded-xl p-3 bg-white">
              <div className="col-span-12 sm:col-span-4">
                <p className="text-sm font-medium text-gray-900">{line.name}</p>
                <p className="text-xs text-gray-500">{line.supplier_name} · {line.unit}</p>
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  label="Qtd"
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={e => updateLine(line.key, { quantity: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  label="Preço un."
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={line.unit_price}
                  onChange={e => updateLine(line.key, { unit_price: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                <p className="text-xs text-gray-400 mb-1">Subtotal</p>
                <p className="text-sm font-bold text-gray-900">
                  {(line.quantity * line.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="secondary" onClick={() => removeLine(line.key)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <p className="text-lg font-bold text-violet-800">
          Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <Button onClick={handleSave} loading={saving}>
          <Save size={16} /> Salvar itens
        </Button>
      </div>
    </div>
  )
}
