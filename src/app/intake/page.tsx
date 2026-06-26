'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  INTAKE_SCOPE_OPTIONS,
  INTAKE_INTERVENTION_OPTIONS,
  INTAKE_BUDGET_OPTIONS,
  INTAKE_URGENCY_OPTIONS,
  intakeStatusLabel,
  type IntakeStatus,
} from '@/lib/intake'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  company: z.string().optional(),
  source: z.enum(['whatsapp', 'indicacao', 'instagram', 'parceiro', 'evento', 'outro']),
  scope: z.enum(['corporativo', 'residencial', 'comercial', 'desenvolvimento', 'outro']),
  intervention: z.enum(['projeto_curadoria', 'reforma_parcial', 'construcao_zero', 'turnkey']),
  budget: z.enum(['ate_150k', '150k_500k', 'acima_500k', 'acima_1m']),
  urgency: z.enum(['sem_pressa', '6_meses', 'urgente']),
})

type FormData = z.infer<typeof schema>

export default function IntakePage() {
  const [submitted, setSubmitted] = useState<{ status: IntakeStatus; reason: string; score: number } | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { source: 'instagram', scope: 'residencial', intervention: 'turnkey', budget: 'acima_500k', urgency: 'sem_pressa' },
  })

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Erro ao enviar')
      setSubmitted({
        status: json.data.status as IntakeStatus,
        reason: json.data.reason,
        score: json.data.score,
      })
      toast.success('Mapeamento recebido com sucesso')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar')
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Estlar</p>
          <h1 className="text-2xl font-light text-stone-900 mb-4">Obrigado pelo seu interesse</h1>
          <p className="text-stone-600 mb-2">{submitted.reason}</p>
          <p className="text-sm text-stone-400 mb-6">
            Status: {intakeStatusLabel(submitted.status)} · Score {submitted.score}
          </p>
          {submitted.status === 'approved' && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
              Nossa equipe entrará em contato em até 48 horas para agendar a Reunião de Imersão.
            </p>
          )}
          <Link href="/login" className="inline-block mt-6 text-sm text-violet-600 hover:underline">
            Área restrita
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Estlar · Hub de Arquitetura</p>
          <h1 className="text-3xl font-light text-stone-900">Mapeamento de Projeto</h1>
          <p className="text-stone-500 mt-3 text-sm leading-relaxed">
            Para garantirmos que nossa expertise é ideal para o seu momento,
            pedimos que preencha este breve mapeamento de 2 minutos.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-5">
          <Input label="Nome completo *" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Telefone *" error={errors.phone?.message} {...register('phone')} />
          </div>
          <Input label="Empresa (opcional)" {...register('company')} />

          <Select label="Escopo principal *" options={INTAKE_SCOPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))} {...register('scope')} />
          <Select label="Nível de intervenção *" options={INTAKE_INTERVENTION_OPTIONS.map(o => ({ value: o.value, label: o.label }))} {...register('intervention')} />
          <Select label="Expectativa de investimento (obra + interiores) *" options={INTAKE_BUDGET_OPTIONS.map(o => ({ value: o.value, label: o.label }))} {...register('budget')} />
          <Select label="Prazo ideal *" options={INTAKE_URGENCY_OPTIONS.map(o => ({ value: o.value, label: o.label }))} {...register('urgency')} />
          <Select
            label="Como nos encontrou"
            options={[
              { value: 'instagram', label: 'Instagram' },
              { value: 'indicacao', label: 'Indicação' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'parceiro', label: 'Parceiro' },
              { value: 'evento', label: 'Evento' },
              { value: 'outro', label: 'Outro' },
            ]}
            {...register('source')}
          />

          <Button type="submit" loading={isSubmitting} className="w-full">
            Enviar mapeamento
          </Button>
        </form>
      </div>
    </div>
  )
}
