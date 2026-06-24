'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { QcpsEditor } from '@/components/ui/QcpsEditor'
import { Button } from '@/components/ui/Button'
import { suppliersApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Supplier } from '@/types/database'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  category: z.string().min(2, 'Categoria obrigatória'),
  contact_name: z.string().min(2, 'Nome do contato obrigatório'),
  contact_email: z.string().email('Email inválido'),
  contact_phone: z.string().min(8, 'Telefone obrigatório'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'pending']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const CATEGORIES = [
  'Construção Civil', 'Acabamentos', 'Móveis', 'Decoração', 'Elétrica',
  'Hidráulica', 'Paisagismo', 'Iluminação', 'Revestimentos', 'Outro',
]

interface Props {
  supplier?: Supplier
  onSuccess: () => void
  onCancel: () => void
}

export function SupplierForm({ supplier, onSuccess, onCancel }: Props) {
  const [qcps, setQcps] = useState({
    score_q: supplier?.score_q ?? 5,
    score_c: supplier?.score_c ?? 5,
    score_p: supplier?.score_p ?? 5,
    score_s: supplier?.score_s ?? 5,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: supplier ?? { status: 'pending' },
  })

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data, ...qcps }
      if (supplier) {
        await suppliersApi.update(supplier.id, payload)
        toast.success('Fornecedor atualizado!')
      } else {
        await suppliersApi.create(payload)
        toast.success('Fornecedor cadastrado!')
      }
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Nome da empresa *" placeholder="Ex: Revestimentos Silva" error={errors.name?.message} {...register('name')} />
        </div>
        <Select
          label="Categoria *"
          error={errors.category?.message}
          options={CATEGORIES.map(c => ({ value: c, label: c }))}
          placeholder="Selecione..."
          {...register('category')}
        />
        <Select
          label="Status"
          options={[
            { value: 'pending', label: 'Pendente' },
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
          ]}
          {...register('status')}
        />
        <Input label="Nome do contato *" placeholder="João Silva" error={errors.contact_name?.message} {...register('contact_name')} />
        <Input label="Telefone *" placeholder="(11) 99999-9999" error={errors.contact_phone?.message} {...register('contact_phone')} />
        <div className="col-span-2">
          <Input label="Email *" type="email" placeholder="contato@empresa.com" error={errors.contact_email?.message} {...register('contact_email')} />
        </div>
        <div className="col-span-2">
          <Input label="Site" type="url" placeholder="https://empresa.com.br" error={errors.website?.message} {...register('website')} />
        </div>
        <div className="col-span-2">
          <Textarea label="Observações" placeholder="Condições especiais, produtos preferidos..." {...register('notes')} />
        </div>
        <div className="col-span-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Avaliação QCPS</p>
          <QcpsEditor values={qcps} onChange={setQcps} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>
          {supplier ? 'Salvar alterações' : 'Cadastrar fornecedor'}
        </Button>
      </div>
    </form>
  )
}
