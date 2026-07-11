import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import {
  applyAuditDecision,
  auditChecklistEvidence,
  getChecklistItemAudit,
  saveChecklistAudit,
} from '@/lib/agents/audit-agent'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { syncHeldPaymentsForProject } from '@/lib/payments/server'
import type { PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'

const runSchema = z.object({
  phase: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  itemId: z.string().min(1),
})

const decideSchema = z.object({
  phase: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  itemId: z.string().min(1),
  decision: z.enum(['approve', 'reject', 'override']),
})

function getItemValue(checklist: PhaseChecklist, phase: ProjectPhase, itemId: string) {
  const raw = checklist[phase]?.[itemId]
  if (raw && typeof raw === 'object' && 'checked' in raw) return raw
  return null
}

/** POST — executar auditoria visual em evidência já anexada */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id: projectId } = await params
    const body = runSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: project } = await db
      .from('projects')
      .select('id, name, checklist, phase')
      .eq('id', projectId)
      .single() as {
      data: { id: string; name: string; checklist: PhaseChecklist; phase: ProjectPhase } | null
    }

    if (!project) return err('Obra não encontrada', 404)
    if (project.phase !== body.phase) return err('Só é possível auditar a fase atual', 422)

    const item = getItemValue(project.checklist ?? {}, body.phase, body.itemId)
    if (!item?.filePath) return err('Anexe uma evidência antes de auditar', 422)

    const result = await auditChecklistEvidence({
      projectId,
      phase: body.phase,
      itemId: body.itemId,
      filePath: item.filePath,
      fileName: item.fileName,
      projectName: project.name,
    })

    await saveChecklistAudit(projectId, body.phase, body.itemId, result.audit, {
      autoCheck: result.can_auto_check,
    })

    await auditAndInvalidate({
      entityType: 'project',
      entityId: projectId,
      eventType: 'checklist.audit',
      title: 'Auditoria visual',
      detail: `${body.itemId} · score ${result.audit.score} · ${result.audit.status}`,
      actorId: profile!.id,
      metadata: { phase: body.phase, itemId: body.itemId, score: result.audit.score, status: result.audit.status },
    })

    syncHeldPaymentsForProject(projectId).catch(console.error)

    const { data: updated } = await db
      .from('projects')
      .select('*, client:clients(*)')
      .eq('id', projectId)
      .single()

    return ok({ project: updated, audit: result.audit, can_auto_check: result.can_auto_check })
  } catch (e) {
    return handleError(e)
  }
}

/** PATCH — gestor confirma, rejeita ou sobrescreve auditoria */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id: projectId } = await params
    const body = decideSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: project } = await db
      .from('projects')
      .select('checklist, phase')
      .eq('id', projectId)
      .single() as { data: { checklist: PhaseChecklist; phase: ProjectPhase } | null }

    if (!project) return err('Obra não encontrada', 404)
    if (project.phase !== body.phase) return err('Só é possível decidir na fase atual', 422)

    const existing = getChecklistItemAudit(project.checklist, body.phase, body.itemId)
    if (!existing) return err('Execute a auditoria antes de decidir', 422)

    const audit = applyAuditDecision(existing, body.decision, profile!.id)
    await saveChecklistAudit(projectId, body.phase, body.itemId, audit, {
      autoCheck: body.decision === 'approve' || body.decision === 'override',
    })

    await auditAndInvalidate({
      entityType: 'project',
      entityId: projectId,
      eventType: 'checklist.audit_decision',
      title: 'Decisão de auditoria',
      detail: `${body.itemId} · ${body.decision}`,
      actorId: profile!.id,
    })

    syncHeldPaymentsForProject(projectId).catch(console.error)

    const { data: updated } = await db
      .from('projects')
      .select('*, client:clients(*)')
      .eq('id', projectId)
      .single()

    return ok({ project: updated, audit })
  } catch (e) {
    return handleError(e)
  }
}
