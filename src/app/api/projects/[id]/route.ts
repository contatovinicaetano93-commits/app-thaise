import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  client_id: z.string().uuid().optional().nullable().transform(v => v || null),
  location: z.string().optional().nullable().transform(v => v || null),
  description: z.string().optional().nullable().transform(v => v || null),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable().transform(v => v || null),
  score_q: z.coerce.number().min(0).max(10).optional(),
  score_c: z.coerce.number().min(0).max(10).optional(),
  score_p: z.coerce.number().min(0).max(10).optional(),
  score_s: z.coerce.number().min(0).max(10).optional(),
  progress_pct: z.coerce.number().min(0).max(100).optional(),
  portal_enabled: z.boolean().optional(),
  current_phase_id: z.string().uuid().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = await createSupabaseServer()

    const { data, error } = await db
      .from('projects')
      .update(payload as never)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Empreendimento não encontrado', 404)

    const project = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'project',
      entityId: project.id,
      eventType: 'project.updated',
      title: 'Empreendimento atualizado',
      detail: project.name,
      actorId: profile!.id,
      cachePrefix: 'projects',
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const db = await createSupabaseServer()

    const { data: existing } = await db.from('projects').select('name').eq('id', id).single() as {
      data: { name: string } | null
    }

    const { error } = await db.from('projects').delete().eq('id', id)
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'project',
      entityId: id,
      eventType: 'project.deleted',
      title: 'Empreendimento removido',
      detail: existing?.name,
      actorId: profile!.id,
      cachePrefix: 'projects',
    })

    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
