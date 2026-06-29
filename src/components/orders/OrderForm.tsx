'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Select, Textarea, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { clientsApi, suppliersApi, productsApi, ordersApi, projectsApi, assistantApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Client, Supplier, Product, Project } from '@/types/database'

const schema = z.object({
  project_id: z.string().optional(),
  client_id: z.string().min(1, 'Selecione um cliente'),
  supplier_id: z.string().min(1, 'Selecione um fornecedor'),
  product_id: z.string().min(1, 'Selecione um produto'),
  quantity: z.number().min(1, 'Quantidade mínima: 1'),
  unit_price: z.number().min(0.01, 'Preço obrigatório'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  defaultProjectId?: string
  defaultClientId?: string
  defaultSupplierId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function OrderForm({ defaultProjectId, defaultClientId, defaultSupplierId, onSuccess, onCancel }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [suggestion, setSuggestion] = useState('')
  const [rankedSuppliers, setRankedSuppliers] = useState<Array<{ id: string; name: string; score: number }>>([])

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: defaultProjectId ?? '',
      client_id: defaultClientId ?? '',
      supplier_id: defaultSupplierId ?? '',
      quantity: 1,
      unit_price: 0,
    },
  })

  const projectId = useWatch({ control, name: 'project_id' })
  const supplierId = useWatch({ control, name: 'supplier_id' })
  const quantity = useWatch({ control, name: 'quantity' }) || 0
  const unitPrice = useWatch({ control, name: 'unit_price' }) || 0
  const total = quantity * unitPrice

  useEffect(() => {
    Promise.all([clientsApi.list(), suppliersApi.list(), projectsApi.list()])
      .then(([c, s, p]) => {
        setClients(c)
        setSuppliers(s)
        setProjects(p)
        if (defaultProjectId) {
          const project = p.find(x => x.id === defaultProjectId)
          if (project?.client_id) setValue('client_id', project.client_id)
        } else if (defaultClientId) {
          setValue('client_id', defaultClientId)
        }
        if (defaultSupplierId) setValue('supplier_id', defaultSupplierId)
      })
      .catch(() => toast.error('Erro ao carregar dados'))
  }, [defaultProjectId, defaultClientId, defaultSupplierId, setValue])

  useEffect(() => {
    if (!projectId) return
    const project = projects.find(p => p.id === projectId)
    if (project?.client_id) setValue('client_id', project.client_id)
  }, [projectId, projects, setValue])

  useEffect(() => {
    if (!supplierId) { setProducts([]); return }
    productsApi.list(supplierId)
      .then(setProducts)
      .catch(() => toast.error('Erro ao carregar produtos'))
    setValue('product_id', '')
    setValue('unit_price', 0)
  }, [supplierId, setValue])

  function onProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const product = products.find(p => p.id === e.target.value)
    if (product) {
      setValue('unit_price', product.price)
      assistantApi.suggest(product.id, product.category)
        .then(r => {
          setSuggestion(r.message)
          setRankedSuppliers(r.suppliers ?? [])
        })
        .catch(() => { setSuggestion(''); setRankedSuppliers([]) })
    }
  }

  function applySuggestedSupplier(id: string) {
    setValue('supplier_id', id)
    toast.success('Fornecedor recomendado aplicado')
  }

  const activeSuppliers = suppliers.filter(s => s.status === 'active')

  async function onSubmit(data: FormData) {
    try {
      await ordersApi.create({
        ...data,
        project_id: data.project_id || null,
        status: 'pending',
      })
      toast.success('Pedido criado!')
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar pedido')
    }
  }

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select
            label="Empreendimento"
            options={activeProjects.map(p => ({
              value: p.id,
              label: `${p.name} · Fase ${p.phase}`,
            }))}
            placeholder="Opcional — vincule a um empreendimento"
            error={errors.project_id?.message}
            {...register('project_id')}
          />
        </div>
        <div className="col-span-2">
          <Select
            label="Cliente *"
            options={clients.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Selecione o cliente..."
            error={errors.client_id?.message}
            {...register('client_id')}
          />
        </div>
        <Select
          label="Fornecedor *"
          options={activeSuppliers.map(s => ({ value: s.id, label: s.name }))}
          placeholder="Selecione o fornecedor ativo..."
          error={errors.supplier_id?.message}
          {...register('supplier_id')}
        />
        {suggestion && (
          <div className="col-span-2 space-y-2">
            <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2">{suggestion}</p>
            {rankedSuppliers.length > 0 && rankedSuppliers[0].id !== supplierId && (
              <button
                type="button"
                onClick={() => applySuggestedSupplier(rankedSuppliers[0].id)}
                className="text-xs font-medium text-violet-700 hover:text-violet-900 underline"
              >
                Usar {rankedSuppliers[0].name} (QCPS {rankedSuppliers[0].score}/10)
              </button>
            )}
          </div>
        )}
        <Select
          label="Produto *"
          options={products.map(p => ({ value: p.id, label: `${p.name} (${p.unit})` }))}
          placeholder={supplierId ? 'Selecione o produto...' : 'Escolha o fornecedor primeiro'}
          error={errors.product_id?.message}
          disabled={!supplierId || products.length === 0}
          {...register('product_id', { onChange: onProductChange })}
        />
        <Input
          label="Quantidade *"
          type="number"
          min={1}
          error={errors.quantity?.message}
          {...register('quantity', { valueAsNumber: true })}
        />
        <Input
          label="Preço unitário (R$) *"
          type="number"
          step="0.01"
          min={0}
          error={errors.unit_price?.message}
          {...register('unit_price', { valueAsNumber: true })}
        />
        <div className="col-span-2 bg-indigo-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-indigo-700 font-medium">Total do pedido</span>
          <span className="text-lg font-bold text-indigo-700">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div className="col-span-2">
          <Textarea label="Observações" placeholder="Especificações, condições de entrega..." {...register('notes')} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Criar pedido</Button>
      </div>
    </form>
  )
}
