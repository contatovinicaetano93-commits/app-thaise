import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { PAYMENT_SELECT } from '@/lib/payments/server'
import {
  findEligibleReleaseAudit,
  isAuditEligibleForRelease,
  releaseBlockReason,
} from '@/lib/payments/escrow'
import { auditAndInvalidate } from '@/lib/memory/audit'
import type { PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'

const releaseSchema = z.object({
  pix_reference: z.string().optional().nullable(),
  release_notes: z.string().optional().nullable(),
  checklist_phase: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).optional(),
  checklist_item_id: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id: paymentId } = await params
    const body = releaseSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: payment } = await db
      .from('order_payments')
      .select('*, order:orders(id, status, project_id)')
      .eq('id', paymentId)
      .single() as {
      data: {
        id: string
        status: string
        project_id: string | null
        order_id: string
        order?: { id: string; status: string; project_id: string | null } | null
      } | null
    }

    if (!payment) return err('Pagamento não encontrado', 404)
    if (payment.status === 'released') return err('Pagamento já liberado', 422)
    if (payment.status === 'cancelled') return err('Pagamento cancelado', 422)

    const projectId = payment.project_id ?? payment.order?.project_id
    if (!projectId) return err('Pedido sem obra vinculada — não é possível validar auditoria', 422)

    const { data: project } = await db
      .from('projects')
      .select('checklist')
      .eq('id', projectId)
      .single() as { data: { checklist: PhaseChecklist } | null }

    const checklist = project?.checklist
    const preferred = body.checklist_phase && body.checklist_item_id
      ? { phase: body.checklist_phase as ProjectPhase, itemId: body.checklist_item_id }
      : undefined

    const eligible = findEligibleReleaseAudit(checklist, preferred)
    if (!eligible || !isAuditEligibleForRelease(eligible.audit)) {
      return err(releaseBlockReason(checklist, preferred), 422)
    }

    const now = new Date().toISOString()
    const { data: updated, error } = await db
      .from('order_payments')
      .update({
        status: 'released',
        released_at: now,
        released_by: profile!.id,
        release_notes: body.release_notes ?? null,
        pix_reference: body.pix_reference ?? null,
        payment_method: body.pix_reference ? 'manual_pix' : 'escrow',
        checklist_phase: eligible.phase,
        checklist_item_id: eligible.itemId,
        audit_status: eligible.audit.status,
        audit_score: eligible.audit.score,
      } as never)
      .eq('id', paymentId)
      .select(PAYMENT_SELECT)
      .single()

    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'order',
      entityId: payment.order_id,
      eventType: 'payment.released',
      title: 'Pagamento liberado',
      detail: `Auditoria ${eligible.audit.status} · score ${eligible.audit.score}`,
      actorId: profile!.id,
      metadata: {
        payment_id: paymentId,
        checklist_phase: eligible.phase,
        checklist_item_id: eligible.itemId,
        pix_reference: body.pix_reference ?? null,
      },
      cachePrefix: 'payments',
    })

    return ok(updated)
  } catch (e) {
    return handleError(e)
  }
}
