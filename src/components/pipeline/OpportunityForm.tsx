'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { opportunitiesApi } from '@/lib/api'
import { OPPORTUNITY_SOURCES } from '@/lib/pipeline'
import { toast } from 'sonner'
import type { Opportunity } from '@/types/database'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  company: z.string().optional(),
  source: z.enum(['whatsapp', 'indicacao', 'instagram', 'parceiro', 'evento', 'outro']),
  budget_estimate: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  opportunity?: Opportunity
  onSuccess: () => void
  onCancel: () => void
}

export function OpportunityForm({ opportunity, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: opportunity
      ? {
          name: opportunity.name,
          email: opportunity.email,
          phone: opportunity.phone,
          company: opportunity.company ?? undefined,
          source: opportunity.source,
          budget_estimate: opportunity.budget_estimate != null ? String(opportunity.budget_estimate) : undefined,
          notes: opportunity.notes ?? undefined,
        }
      : { source: 'whatsapp' },
  })

  async function onSubmit(data: FormData) {
    const budgetRaw = data.budget_estimate?.trim()
    const budgetNum = budgetRaw ? Number(budgetRaw) : null
    if (budgetNum !== null && (Number.isNaN(budgetNum) || budgetNum <= 0)) {
      toast.error('Potencial de investimento inválido')
      return
    }

    const payload = {
      ...data,
      company: data.company || null,
      budget_estimate: budgetNum,
      notes: data.notes || null,
    }

    try {
      if (opportunity) {
        await opportunitiesApi.update(opportunity.id, payload)
        toast.success('Oportunidade atualizada!')
      } else {
        await opportunitiesApi.create({
          ...payload,
          stage: 'primeiro_contato',
          source: payload.source,
        })
        toast.success('Oportunidade criada!')
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
          <Input label="Nome do investidor *" placeholder="Carlos Mendes" error={errors.name?.message} {...register('name')} />
        </div>
        <Input label="Email *" type="email" placeholder="carlos@email.com" error={errors.email?.message} {...register('email')} />
        <Input label="Telefone *" placeholder="(11) 99999-9999" error={errors.phone?.message} {...register('phone')} />
        <Input label="Empresa / Fundo" placeholder="Mendes Investimentos" {...register('company')} />
        <Select
          label="Origem do lead"
          options={OPPORTUNITY_SOURCES.map(s => ({ value: s.value, label: s.label }))}
          {...register('source')}
        />
        <div className="col-span-2">
          <Input
            label="Potencial de investimento (R$)"
            type="number"
            placeholder="2500000"
            {...register('budget_estimate')}
          />
        </div>
        <div className="col-span-2">
          <Textarea
            label="Notas da última reunião"
            placeholder="Perfil do investidor, preferências, próximos passos..."
            {...register('notes')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>
          {opportunity ? 'Salvar alterações' : 'Adicionar ao pipeline'}
        </Button>
      </div>
    </form>
  )
}
