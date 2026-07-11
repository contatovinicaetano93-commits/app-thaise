import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { ACTIVE_PIPELINE_STAGES, STAGE_LABELS } from '@/lib/pipeline'
import { validateStageTransition } from '@/lib/pipeline/stage-gates'
import type { Opportunity } from '@/types/database'

const schema = z.object({
  stage: z.enum([
    'primeiro_contato', 'briefing', 'viabilidade_previa', 'proposta', 'contrato', 'perdido',
  ]),
  lost_reason: z.string().optional().transform(v => v || null),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const { stage, lost_reason } = schema.parse(body)

    const db = await createSupabaseServer()

    const { data: existing } = await db
      .from('opportunities')
      .select('stage, name, briefing_data, briefing_type, fee_model')
      .eq('id', id)
      .single() as { data: Pick<Opportunity, 'stage' | 'name' | 'briefing_data' | 'briefing_type' | 'fee_model'> | null }

    if (!existing) return err('Oportunidade não encontrada', 404)
    if (existing.stage === 'ganho') return err('Oportunidade já convertida', 422)

    const gateErr = validateStageTransition(existing, stage)
    if (gateErr) return err(gateErr, 422)

    const updates: Record<string, unknown> = { stage }
    if (stage === 'perdido') {
      updates.closed_at = new Date().toISOString()
      if (lost_reason) updates.lost_reason = lost_reason
    } else if (ACTIVE_PIPELINE_STAGES.includes(stage)) {
      updates.closed_at = null
      updates.lost_reason = null
    }

    const { data, error } = await db
      .from('opportunities')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)

    const fromLabel = STAGE_LABELS[existing.stage]
    const toLabel = STAGE_LABELS[stage]

    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: id,
      eventType: 'opportunity.stage_changed',
      title: stage === 'perdido' ? 'Oportunidade perdida' : `Movido: ${fromLabel} → ${toLabel}`,
      detail: existing.name,
      actorId: profile!.id,
      cachePrefix: 'opportunities',
      metadata: { from: existing.stage, to: stage, lost_reason },
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
