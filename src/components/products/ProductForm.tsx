'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { productsApi, suppliersApi } from '@/lib/api'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'
import type { Product, Supplier } from '@/types/database'

const schema = z.object({
  supplier_id: z.string().uuid('Selecione um fornecedor'),
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  category: z.string().min(2, 'Categoria obrigatória'),
  price: z.number().min(0.01, 'Preço obrigatório'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  min_order: z.number().int().min(1).optional(),
  lead_time_days: z.number().int().min(0).optional(),
  active: z.boolean(),
})

type FormData = z.infer<typeof schema>

const UNITS = ['un', 'm²', 'm', 'kg', 'cx', 'pç', 'l', 'kit']
const CATEGORIES = ['Revestimento', 'Mobiliário', 'Iluminação', 'Hidráulica', 'Elétrica', 'Acabamento', 'Paisagismo', 'Outro']

interface Props {
  product?: Product
  defaultSupplierId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, defaultSupplierId, onSuccess, onCancel }: Props) {
  const { role, profile } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const isFornecedor = role === 'fornecedor'
  const linkedSupplier = suppliers.find(s => s.id === profile?.supplier_id)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ?? { active: true, unit: 'un' },
  })

  useEffect(() => {
    suppliersApi.list().then(setSuppliers).catch(() => toast.error('Erro ao carregar fornecedores'))
  }, [])

  useEffect(() => {
    if (isFornecedor && profile?.supplier_id && !product) {
      setValue('supplier_id', profile.supplier_id)
    } else if (!product && defaultSupplierId) {
      setValue('supplier_id', defaultSupplierId)
    }
  }, [isFornecedor, profile?.supplier_id, product, defaultSupplierId, setValue])

  async function onSubmit(data: FormData) {
    try {
      if (product) {
        await productsApi.update(product.id, data)
        toast.success('Produto atualizado!')
      } else {
        await productsApi.create(data)
        toast.success('Produto cadastrado!')
      }
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isFornecedor && linkedSupplier?.status !== 'active' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Seu cadastro ainda aguarda homologação pela Estlar. Produtos só entram no catálogo após aprovação.
        </div>
      )}
      {isFornecedor && linkedSupplier?.status === 'active' && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          Produtos ficam no seu catálogo. A Estlar vincula obra + produto ao criar pedidos para empreendimentos homologados.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          {isFornecedor ? (
            <>
              <input type="hidden" {...register('supplier_id')} />
              <p className="text-sm font-medium text-gray-700 mb-1">Fornecedor</p>
              <p className="text-sm text-gray-600 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                {linkedSupplier?.name ?? 'Seu fornecedor vinculado'}
              </p>
            </>
          ) : (
            <Select
              label="Fornecedor *"
              options={suppliers.filter(s => s.status === 'active').map(s => ({ value: s.id, label: s.name }))}
              placeholder="Selecione o fornecedor homologado..."
              error={errors.supplier_id?.message}
              {...register('supplier_id')}
            />
          )}
        </div>
        <div className="col-span-2">
          <Input label="Nome do produto *" placeholder="Porcelanato 60x60 Mármore" error={errors.name?.message} {...register('name')} />
        </div>
        <Select
          label="Categoria *"
          options={CATEGORIES.map(c => ({ value: c, label: c }))}
          placeholder="Selecione..."
          error={errors.category?.message}
          {...register('category')}
        />
        <Select
          label="Unidade *"
          options={UNITS.map(u => ({ value: u, label: u }))}
          error={errors.unit?.message}
          {...register('unit')}
        />
        <Input
          label="Preço unitário (R$) *"
          type="number"
          step="0.01"
          placeholder="0,00"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
        <Input
          label="Pedido mínimo"
          type="number"
          min={1}
          placeholder="1"
          {...register('min_order', { valueAsNumber: true })}
        />
        <Input
          label="Prazo de entrega (dias)"
          type="number"
          min={0}
          placeholder="7"
          {...register('lead_time_days', { valueAsNumber: true })}
        />
        <div className="flex items-center gap-3 pt-5">
          <input type="checkbox" id="active" className="w-4 h-4 accent-violet-600" {...register('active')} />
          <label htmlFor="active" className="text-sm font-medium text-gray-700">Produto ativo</label>
        </div>
        <div className="col-span-2">
          <Textarea label="Descrição" placeholder="Detalhes, especificações técnicas..." {...register('description')} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={isFornecedor && linkedSupplier?.status !== 'active'}>
          {product ? 'Salvar alterações' : 'Cadastrar produto'}
        </Button>
      </div>
    </form>
  )
}
