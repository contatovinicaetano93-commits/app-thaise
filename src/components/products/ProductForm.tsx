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
import type { Product, Supplier, SkuRequest } from '@/types/database'

const schema = z.object({
  supplier_id: z.string().uuid(),
  sku_request_id: z.string().uuid().optional(),
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
  skuRequest?: SkuRequest
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, defaultSupplierId, skuRequest, onSuccess, onCancel }: Props) {
  const { role, profile } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const isFornecedor = role === 'fornecedor'
  const isSkuFill = Boolean(skuRequest && !product)
  const linkedSupplier = suppliers.find(s => s.id === profile?.supplier_id)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          supplier_id: product.supplier_id,
          name: product.name,
          category: product.category,
          price: product.price,
          unit: product.unit,
          active: product.active,
          description: product.description ?? '',
          min_order: product.min_order,
          lead_time_days: product.lead_time_days,
          sku_request_id: product.sku_request_id ?? undefined,
        }
      : {
          active: true,
          unit: skuRequest?.unit ?? 'un',
          name: skuRequest?.name ?? '',
          category: skuRequest?.category ?? 'Outro',
          supplier_id: skuRequest?.supplier_id ?? profile?.supplier_id ?? '',
          sku_request_id: skuRequest?.id,
          price: 0,
        },
  })

  useEffect(() => {
    if (!isFornecedor) {
      suppliersApi.list().then(setSuppliers).catch(() => toast.error('Erro ao carregar fornecedores'))
    }
  }, [isFornecedor])

  useEffect(() => {
    if (isFornecedor && profile?.supplier_id && !product) {
      setValue('supplier_id', profile.supplier_id)
    } else if (!product && defaultSupplierId) {
      setValue('supplier_id', defaultSupplierId)
    }
    if (skuRequest && !product) {
      setValue('sku_request_id', skuRequest.id)
      setValue('name', skuRequest.name)
      setValue('category', skuRequest.category)
      setValue('unit', skuRequest.unit)
    }
  }, [isFornecedor, profile?.supplier_id, product, defaultSupplierId, skuRequest, setValue])

  async function onSubmit(data: FormData) {
    try {
      if (product) {
        await productsApi.update(product.id, data)
        toast.success('Produto atualizado!')
      } else {
        await productsApi.create({
          ...data,
          sku_request_id: data.sku_request_id ?? skuRequest?.id,
        })
        toast.success(isSkuFill ? 'SKU enviado — aguardando aprovação da Estlar' : 'Produto cadastrado!')
      }
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  if (isFornecedor && !product && !skuRequest) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Cadastre produtos apenas quando a Estlar pedir um SKU em <strong>SKUs solicitados</strong>.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>Fechar</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isSkuFill && (
        <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-900">
          Obra: <strong>{skuRequest!.project?.name}</strong> · Após enviar, a Estlar aprova para o catálogo.
        </div>
      )}
      {isFornecedor && linkedSupplier?.status !== 'active' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Seu cadastro ainda aguarda homologação pela Estlar.
        </div>
      )}
      <input type="hidden" {...register('supplier_id')} />
      {isSkuFill && <input type="hidden" {...register('sku_request_id')} />}
      <div className="grid grid-cols-2 gap-4">
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
        {!isSkuFill && (
          <div className="flex items-center gap-3 pt-5">
            <input type="checkbox" id="active" className="w-4 h-4 accent-violet-600" {...register('active')} />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">Produto ativo</label>
          </div>
        )}
        <div className="col-span-2">
          <Textarea label="Descrição" placeholder="Detalhes, especificações técnicas..." {...register('description')} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={isFornecedor && linkedSupplier?.status !== 'active'}>
          {product ? 'Salvar alterações' : isSkuFill ? 'Enviar SKU para aprovação' : 'Cadastrar produto'}
        </Button>
      </div>
    </form>
  )
}
