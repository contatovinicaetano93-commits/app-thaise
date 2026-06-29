import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, requireGestor } from '@/lib/auth/api-context'
import { validatePhaseWeights } from '@/lib/projects/default-phases'
import { auditAndInvalidate } from '@/lib/memory/audit'
import type { ProjectPhaseRow } from '@/types/database'

const phaseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  weight_pct: z.coerce.number().min(0.01).max(100),
})

const bodySchema = z.object({
  phases: z.array(phaseSchema).min(1).max(20),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const db = await createSupabaseServer()

    if (profile!.role === 'cliente') {
      const { data: project } = await db
        .from('projects')
        .select('client_id, portal_enabled')
        .eq('id', id)
        .single() as { data: { client_id: string | null; portal_enabled: boolean } | null }
      if (!project || project.client_id !== profile!.client_id || !project.portal_enabled) {
        return err('Acesso negado', 403)
      }
    } else if (profile!.role !== 'gestor') {
      return err('Acesso negado', 403)
    }

    const { data, error } = await db
      .from('project_phases')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id: projectId } = await params
    const body = bodySchema.parse(await req.json())
    const weightErr = validatePhaseWeights(body.phases.map(p => p.weight_pct))
    if (weightErr) return err(weightErr, 422)

    const db = await createSupabaseServer()

    const { data: project } = await db.from('projects').select('id, current_phase_id').eq('id', projectId).single()
    if (!project) return err('Obra não encontrada', 404)

    const { error: delErr } = await db.from('project_phases').delete().eq('project_id', projectId)
    if (delErr) return err(delErr.message, 500)

    const inserts = body.phases.map((p, i) => ({
      project_id: projectId,
      name: p.name.trim(),
      sort_order: i,
      weight_pct: p.weight_pct,
    }))

    const { data: created, error: insErr } = await db
      .from('project_phases')
      .insert(inserts as never)
      .select('*')

    if (insErr) return err(insErr.message, 500)

    const phases = (created ?? []) as ProjectPhaseRow[]
    const prev = project as { current_phase_id: string | null }
    let currentPhaseId = prev.current_phase_id

    if (currentPhaseId && !phases.some(p => p.id === currentPhaseId)) {
      currentPhaseId = phases[0]?.id ?? null
    }
    if (!currentPhaseId && phases[0]) currentPhaseId = phases[0].id

    await db.from('projects').update({ current_phase_id: currentPhaseId } as never).eq('id', projectId)

    await auditAndInvalidate({
      entityType: 'project',
      entityId: projectId,
      eventType: 'project.phases_updated',
      title: 'Fases da obra atualizadas',
      actorId: profile!.id,
      cachePrefix: 'projects',
    })

    return ok(phases)
  } catch (e) {
    return handleError(e)
  }
}
