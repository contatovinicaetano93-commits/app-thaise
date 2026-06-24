'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { QcpsEditor } from '@/components/ui/QcpsEditor'
import { Button } from '@/components/ui/Button'
import { projectsApi, clientsApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Project, Client } from '@/types/database'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  client_id: z.string().min(1, 'Cliente obrigatório (SIPOC: Input)'),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  project?: Project
  onSuccess: () => void
  onCancel: () => void
}

export function ProjectForm({ project, onSuccess, onCancel }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [qcps, setQcps] = useState({
    score_q: project?.score_q ?? 5,
    score_c: project?.score_c ?? 5,
    score_p: project?.score_p ?? 5,
    score_s: project?.score_s ?? 5,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      client_id: project?.client_id ?? '',
      location: project?.location ?? '',
      description: project?.description ?? '',
      status: project?.status ?? 'active',
      notes: project?.notes ?? '',
    },
  })

  useEffect(() => {
    clientsApi.list().then(setClients).catch(() => {})
  }, [])

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        ...qcps,
        client_id: data.client_id || null,
        location: data.location || null,
        description: data.description || null,
        notes: data.notes || null,
      }
      if (project) {
        await projectsApi.update(project.id, payload)
        toast.success('Empreendimento atualizado!')
      } else {
        await projectsApi.create(payload)
        toast.success('Empreendimento criado!')
      }
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome do empreendimento *" placeholder="Ex: Residencial Chapada" error={errors.name?.message} {...register('name')} />

      <Select
        label="Cliente"
        placeholder="Selecione (opcional)"
        options={clients.map(c => ({ value: c.id, label: c.name }))}
        {...register('client_id')}
      />

      <Input label="Localização" placeholder="Ex: Goiânia, GO" {...register('location')} />

      <Textarea label="Descrição" placeholder="Resumo do empreendimento..." {...register('description')} />

      <Select
        label="Status"
        options={[
          { value: 'active', label: 'Ativo' },
          { value: 'paused', label: 'Pausado' },
          { value: 'completed', label: 'Concluído' },
          { value: 'cancelled', label: 'Cancelado' },
        ]}
        {...register('status')}
      />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Avaliação QCPS</p>
        <QcpsEditor values={qcps} onChange={setQcps} />
      </div>

      <Textarea label="Observações" {...register('notes')} />

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>
          {project ? 'Salvar' : 'Criar empreendimento'}
        </Button>
      </div>
    </form>
  )
}
