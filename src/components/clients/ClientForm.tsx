'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { clientsApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Client } from '@/types/database'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  company: z.string().optional(),
  segment: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const SEGMENTS = ['Residencial', 'Comercial', 'Industrial', 'Incorporadora', 'Construtora', 'Arquiteto/Designer', 'Outro']

interface Props {
  client?: Client
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({ client, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: client ?? {},
  })

  async function onSubmit(data: FormData) {
    try {
      if (client) {
        await clientsApi.update(client.id, data)
        toast.success('Cliente atualizado!')
      } else {
        await clientsApi.create(data)
        toast.success('Cliente cadastrado!')
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
          <Input label="Nome completo *" placeholder="Maria Oliveira" error={errors.name?.message} {...register('name')} />
        </div>
        <Input label="Email *" type="email" placeholder="maria@email.com" error={errors.email?.message} {...register('email')} />
        <Input label="Telefone *" placeholder="(11) 99999-9999" error={errors.phone?.message} {...register('phone')} />
        <Input label="Empresa" placeholder="Oliveira Incorporações" {...register('company')} />
        <Select
          label="Segmento"
          options={SEGMENTS.map(s => ({ value: s, label: s }))}
          placeholder="Selecione..."
          {...register('segment')}
        />
        <div className="col-span-2">
          <Textarea label="Observações" placeholder="Preferências, histórico, indicação..." {...register('notes')} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>
          {client ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
      </div>
    </form>
  )
}
