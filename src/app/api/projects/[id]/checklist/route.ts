import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/api-context'
import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'

const schema = z.object({
  phase: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  itemId: z.string(),
  checked: z.boolean(),
  evidence: z.string().optional().transform(v => v?.trim() || undefined),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  audit: z.object({
    status: z.enum(['pending', 'passed', 'failed', 'override']),
    score: z.number(),
    summary: z.string(),
    issues: z.array(z.string()),
    ai_powered: z.boolean(),
    audited_at: z.string(),
    approved_by: z.string().nullable().optional(),
    approved_at: z.string().nullable().optional(),
  }).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'gestor') return err('Apenas gestor pode editar checklist', 403)

    const { id } = await params
    const { phase, itemId, checked, evidence, filePath, fileName, audit } = schema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: project, error: fetchErr } = await db
      .from('projects')
      .select('checklist, phase')
      .eq('id', id)
      .single() as { data: { checklist: PhaseChecklist; phase: ProjectPhase } | null; error: { message: string } | null }

    if (fetchErr || !project) return err('Empreendimento não encontrado', 404)
    if (project.phase !== phase) return err('Só é possível editar o checklist da fase atual', 400)

    const checklist = { ...(project.checklist ?? {}) } as PhaseChecklist
    const prev = checklist[phase]?.[itemId]
    const prevObj = prev && typeof prev === 'object' && 'checked' in prev ? prev : null

    // A auditoria visual é consultiva no checklist — não trava a obra.
    // O portão de garantia real fica na liberação do pagamento (escrow).
    const value = prevObj || evidence || filePath || fileName || audit
      ? {
          checked,
          evidence: evidence ?? prevObj?.evidence,
          filePath: filePath ?? prevObj?.filePath,
          fileName: fileName ?? prevObj?.fileName,
          audit: audit ?? prevObj?.audit,
        }
      : checked
    checklist[phase] = { ...(checklist[phase] ?? {}), [itemId]: value }

    const { data, error } = await db
      .from('projects')
      .update({ checklist } as never)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
