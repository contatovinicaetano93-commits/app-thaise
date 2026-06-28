'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BRAND } from '@/lib/brand'
import {
  INTAKE_SCOPE_OPTIONS,
  INTAKE_INTERVENTION_OPTIONS,
  INTAKE_BUDGET_OPTIONS,
  INTAKE_URGENCY_OPTIONS,
  intakeStatusLabel,
  type IntakeStatus,
} from '@/lib/intake'
import { toast } from 'sonner'
import { PublicLegalFooter } from '@/components/legal/PublicLegalFooter'
import { PRIVACY_POLICY_VERSION } from '@/lib/legal/constants'

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
  consentAccepted: z
    .boolean()
    .refine(v => v === true, { message: 'Aceite a Política de Privacidade para continuar' }),
})

type FormData = z.infer<typeof schema>

export default function IntakePage() {
  const [submitted, setSubmitted] = useState<{ status: IntakeStatus; reason: string; score: number } | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: 'instagram',
      scope: 'residencial',
      intervention: 'turnkey',
      budget: 'acima_500k',
      urgency: 'sem_pressa',
      consentAccepted: undefined,
    },
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
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--background)' }}
      >
        <div className="max-w-lg w-full rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)] mb-2">
            {BRAND.name}
          </p>
          <h1 className="font-display text-2xl font-light text-gray-900 tracking-wide mb-4">
            Mapeamento recebido
          </h1>
          <p className="text-gray-600 mb-2 leading-relaxed">{submitted.reason}</p>
          <p className="text-sm text-[var(--estlar-titanium)] mb-6">
            Status: {intakeStatusLabel(submitted.status)} · Score {submitted.score}
          </p>
          {submitted.status === 'approved' && (
            <p
              className="text-sm rounded-xl px-4 py-3 leading-relaxed"
              style={{
                color: 'var(--estlar-wine)',
                background: 'color-mix(in srgb, var(--estlar-wine) 8%, white)',
              }}
            >
              Nossa equipe entrará em contato em até 48 horas para agendar a Reunião de Imersão.
            </p>
          )}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--estlar-wine)' }}
            >
              Voltar ao site
            </Link>
            <Link href="/login" className="text-xs text-[var(--estlar-titanium)] hover:text-gray-700">
              Área restrita
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel editorial — Obsidiana */}
      <div
        className="hidden lg:flex w-[42%] flex-col justify-between p-12 lg:p-16 shrink-0"
        style={{ background: 'var(--estlar-obsidian)' }}
      >
        <div>
          <Link href="/" className="inline-block group">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)] group-hover:text-[var(--estlar-sand)] transition-colors">
              {BRAND.name}
            </p>
            <p className="text-sm text-[var(--estlar-sand)] mt-1 tracking-wide">{BRAND.subtitle}</p>
          </Link>
        </div>

        <div className="max-w-sm">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--estlar-wine-light)] mb-6">
            Mapeamento inicial
          </p>
          <blockquote className="font-display text-[1.5rem] font-light text-[var(--estlar-linen)] leading-snug tracking-wide">
            &ldquo;{BRAND.manifesto}&rdquo;
          </blockquote>
          <p className="mt-8 text-sm leading-relaxed text-[var(--estlar-titanium)]">
            Para garantirmos que nossa expertise é ideal para o seu momento,
            pedimos que preencha este breve mapeamento de cerca de dois minutos.
          </p>
        </div>

        <p className="text-xs text-[var(--estlar-titanium)] tracking-wide">
          {BRAND.tagline}
        </p>
      </div>

      {/* Formulário — Areia / Linho */}
      <div
        className="flex-1 py-10 px-6 lg:py-16 lg:px-12 overflow-y-auto"
        style={{ background: 'var(--background)' }}
      >
        <div className="max-w-xl mx-auto">
          <div className="mb-10 lg:hidden">
            <Link href="/">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)]">
                {BRAND.name}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{BRAND.subtitle}</p>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-light text-gray-900 tracking-wide">Mapeamento de Projeto</h1>
            <p className="text-sm text-[var(--estlar-titanium)] mt-2 leading-relaxed">
              Estruture a decisão antes de executar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8 space-y-5 shadow-sm"
          >
            <Input label="Nome completo *" error={errors.name?.message} {...register('name')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="E-mail *" type="email" error={errors.email?.message} {...register('email')} />
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

            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[var(--border)] px-4 py-3 bg-[color-mix(in_srgb,var(--estlar-sand)_25%,white)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--estlar-wine)]"
                {...register('consentAccepted')}
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Li e aceito a{' '}
                <Link href="/privacidade" target="_blank" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--estlar-wine)' }}>
                  Política de Privacidade
                </Link>{' '}
                e os{' '}
                <Link href="/termos" target="_blank" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--estlar-wine)' }}>
                  Termos de Uso
                </Link>
                . Autorizo o tratamento dos meus dados para qualificação comercial (LGPD, v. {PRIVACY_POLICY_VERSION}).
              </span>
            </label>
            {errors.consentAccepted && (
              <p className="text-xs text-red-600 -mt-2">{errors.consentAccepted.message}</p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full !rounded-xl !py-3">
              Enviar mapeamento
            </Button>
          </form>

          <PublicLegalFooter className="mt-8" />
        </div>
      </div>
    </div>
  )
}
