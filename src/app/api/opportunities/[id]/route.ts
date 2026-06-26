import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  company: z.string().optional().transform(v => v || null),
  source: z.enum(['whatsapp', 'indicacao', 'instagram', 'parceiro', 'evento', 'outro']).optional(),
  budget_estimate: z.coerce.number().positive().optional().nullable().transform(v => v ?? null),
  notes: z.string().optional().transform(v => v || null),
  lost_reason: z.string().optional().transform(v => v || null),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = createServerClient()

    const { data: existing } = await db
      .from('opportunities')
      .select('stage')
      .eq('id', id)
      .single() as { data: { stage: string } | null }

    if (!existing) return err('Oportunidade não encontrada', 404)
    if (existing.stage === 'ganho') return err('Oportunidade já convertida', 422)

    const { data, error } = await db
      .from('opportunities')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Oportunidade não encontrada', 404)

    const row = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: row.id,
      eventType: 'opportunity.updated',
      title: 'Oportunidade atualizada',
      detail: row.name,
      actorId: profile!.id,
      cachePrefix: 'opportunities',
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const db = createServerClient()

    const { data: existing } = await db
      .from('opportunities')
      .select('stage')
      .eq('id', id)
      .single() as { data: { stage: string } | null }

    if (!existing) return err('Oportunidade não encontrada', 404)
    if (existing.stage === 'ganho') return err('Não é possível excluir oportunidade convertida', 422)

    const { error } = await db.from('opportunities').delete().eq('id', id)
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: id,
      eventType: 'opportunity.deleted',
      title: 'Oportunidade removida',
      cachePrefix: 'opportunities',
    })

    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
