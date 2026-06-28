import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const { action, reason } = schema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: existing } = await db
      .from('opportunities')
      .select('id, name, stage, intake_status, intake_score')
      .eq('id', id)
      .single() as {
      data: {
        id: string
        name: string
        stage: string
        intake_status: string | null
        intake_score: number | null
      } | null
    }

    if (!existing) return err('Oportunidade não encontrada', 404)
    if (existing.stage === 'ganho') return err('Oportunidade já convertida', 422)
    if (existing.stage === 'perdido') return err('Oportunidade já arquivada', 422)

    if (action === 'approve') {
      const updates = {
        intake_status: 'approved' as const,
        stage: existing.stage === 'primeiro_contato' ? 'briefing' as const : existing.stage,
        notes: reason
          ? `Intake aprovado manualmente — ${reason}`
          : 'Intake aprovado manualmente pela gestora',
      }

      const { data, error } = await db
        .from('opportunities')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) return err(error.message, 500)

      await auditAndInvalidate({
        entityType: 'opportunity',
        entityId: id,
        eventType: 'opportunity.intake_approved',
        title: 'Intake aprovado',
        detail: existing.name,
        actorId: profile!.id,
        cachePrefix: 'opportunities',
      })

      return ok(data)
    }

    const { data, error } = await db
      .from('opportunities')
      .update({
        intake_status: 'rejected',
        stage: 'perdido',
        lost_reason: reason ?? 'Intake não qualificado — revisão manual',
        closed_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: id,
      eventType: 'opportunity.intake_rejected',
      title: 'Intake rejeitado',
      detail: existing.name,
      actorId: profile!.id,
      cachePrefix: 'opportunities',
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
