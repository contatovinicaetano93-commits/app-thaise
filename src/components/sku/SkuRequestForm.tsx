'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { skuRequestsApi, projectsApi, suppliersApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Project, Supplier } from '@/types/database'

const schema = z.object({
  project_id: z.string().uuid('Selecione a obra'),
  supplier_id: z.string().uuid('Selecione o fornecedor homologado'),
  name: z.string().min(2, 'Descreva o SKU que precisa'),
  category: z.string().min(2),
  unit: z.string().min(1),
  quantity_estimated: z.number().int().min(1).optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const UNITS = ['un', 'm²', 'm', 'kg', 'cx', 'pç', 'l', 'kit']
const CATEGORIES = ['Revestimento', 'Mobiliário', 'Iluminação', 'Hidráulica', 'Elétrica', 'Acabamento', 'Paisagismo', 'Outro']

interface Props {
  defaultProjectId?: string
  defaultSupplierId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function SkuRequestForm({ defaultProjectId, defaultSupplierId, onSuccess, onCancel }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'Outro',
      unit: 'un',
      project_id: defaultProjectId ?? '',
      supplier_id: defaultSupplierId ?? '',
    },
  })

  useEffect(() => {
    Promise.all([projectsApi.list(), suppliersApi.list()])
      .then(([p, s]) => {
        setProjects(p)
        setSuppliers(s.filter(x => x.status === 'active'))
      })
      .catch(() => toast.error('Erro ao carregar dados'))
  }, [])

  useEffect(() => {
    if (defaultProjectId) setValue('project_id', defaultProjectId)
    if (defaultSupplierId) setValue('supplier_id', defaultSupplierId)
  }, [defaultProjectId, defaultSupplierId, setValue])

  async function onSubmit(data: FormData) {
    try {
      await skuRequestsApi.create({
        ...data,
        quantity_estimated: data.quantity_estimated ?? null,
        due_date: data.due_date || null,
        notes: data.notes || null,
      })
      toast.success('Pedido de SKU enviado ao fornecedor')
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar pedido')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Obra *"
        placeholder="Selecione a obra..."
        options={projects.map(p => ({ value: p.id, label: p.name }))}
        error={errors.project_id?.message}
        {...register('project_id')}
      />
      <Select
        label="Fornecedor homologado *"
        placeholder="Quem deve cadastrar este SKU..."
        options={suppliers.map(s => ({ value: s.id, label: s.name }))}
        error={errors.supplier_id?.message}
        {...register('supplier_id')}
      />
      <Input
        label="SKU / produto que você precisa *"
        placeholder="Ex: Porcelanato 90x90 Calacatta"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Categoria"
          options={CATEGORIES.map(c => ({ value: c, label: c }))}
          {...register('category')}
        />
        <Select
          label="Unidade"
          options={UNITS.map(u => ({ value: u, label: u }))}
          {...register('unit')}
        />
        <Input
          label="Qtd. estimada"
          type="number"
          min={1}
          placeholder="Opcional"
          {...register('quantity_estimated', { valueAsNumber: true })}
        />
        <Input label="Prazo desejado" type="date" {...register('due_date')} />
      </div>
      <Textarea label="Observações para o fornecedor" placeholder="Especificações, referência, ambiente..." {...register('notes')} />
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Pedir SKU ao fornecedor</Button>
      </div>
    </form>
  )
}
