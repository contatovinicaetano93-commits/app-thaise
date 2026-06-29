import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { refreshProjectReport } from '@/lib/projects/intelligence'

const schema = z.object({
  progress_pct: z.coerce.number().min(0).max(100).optional(),
  current_phase_id: z.string().uuid().nullable().optional(),
  portal_enabled: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const payload = schema.parse(await req.json())
    const db = await createSupabaseServer()

    if (payload.current_phase_id) {
      const { data: phase } = await db
        .from('project_phases')
        .select('id')
        .eq('id', payload.current_phase_id)
        .eq('project_id', id)
        .single()
      if (!phase) return err('Fase não pertence a esta obra', 422)
    }

    const { data, error } = await db
      .from('projects')
      .update(payload as never)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Obra não encontrada', 404)

    const project = data as { id: string; name: string; portal_enabled?: boolean }
    await auditAndInvalidate({
      entityType: 'project',
      entityId: project.id,
      eventType: 'project.progress_updated',
      title: payload.portal_enabled ? 'Portal do cliente liberado' : 'Progresso da obra atualizado',
      detail: project.name,
      actorId: profile!.id,
      cachePrefix: 'projects',
    })

    refreshProjectReport(project.id).catch(console.error)

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
