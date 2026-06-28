'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  INTAKE_BUDGET_OPTIONS,
  INTAKE_INTERVENTION_OPTIONS,
  INTAKE_SCOPE_OPTIONS,
  INTAKE_URGENCY_OPTIONS,
  intakeStatusColor,
  intakeStatusLabel,
} from '@/lib/intake'
import { opportunitiesApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Opportunity } from '@/types/database'

function labelFor<T extends { value: string; label: string }>(options: T[], value?: string | null) {
  return options.find(o => o.value === value)?.label ?? value ?? '—'
}

interface Props {
  opportunity: Opportunity
  onReviewed: () => void
}

export function IntakeReviewPanel({ opportunity, onReviewed }: Props) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const intake = opportunity.intake_data
  const needsReview = opportunity.intake_status === 'pending' || opportunity.intake_status === 'review'

  if (!intake && !opportunity.intake_status) return null

  async function review(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      await opportunitiesApi.reviewIntake(opportunity.id, action, reason || undefined)
      toast.success(action === 'approve' ? 'Lead aprovado — movido para briefing' : 'Lead rejeitado e arquivado')
      onReviewed()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na revisão')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-amber-900">Revisão de intake</p>
        {opportunity.intake_status && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${intakeStatusColor(opportunity.intake_status)}`}>
            {intakeStatusLabel(opportunity.intake_status)}
            {opportunity.intake_score != null ? ` · score ${opportunity.intake_score}` : ''}
          </span>
        )}
      </div>

      {intake && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-amber-950/90">
          <div><dt className="text-amber-800/70">Escopo</dt><dd>{labelFor(INTAKE_SCOPE_OPTIONS, intake.scope)}</dd></div>
          <div><dt className="text-amber-800/70">Intervenção</dt><dd>{labelFor(INTAKE_INTERVENTION_OPTIONS, intake.intervention)}</dd></div>
          <div><dt className="text-amber-800/70">Orçamento</dt><dd>{labelFor(INTAKE_BUDGET_OPTIONS, intake.budget)}</dd></div>
          <div><dt className="text-amber-800/70">Prazo</dt><dd>{labelFor(INTAKE_URGENCY_OPTIONS, intake.urgency)}</dd></div>
        </dl>
      )}

      {opportunity.notes && (
        <p className="text-xs text-amber-900/80 border-t border-amber-200/60 pt-2">{opportunity.notes}</p>
      )}

      {needsReview && (
        <>
          <Input
            label="Observação (opcional)"
            placeholder="Motivo da decisão..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => review('approve')}
              loading={loading === 'approve'}
              disabled={loading === 'reject'}
              className="gap-1.5"
            >
              <CheckCircle size={14} /> Aprovar lead
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => review('reject')}
              loading={loading === 'reject'}
              disabled={loading === 'approve'}
              className="gap-1.5"
            >
              <XCircle size={14} /> Rejeitar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
