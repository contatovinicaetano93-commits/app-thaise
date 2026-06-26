import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
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
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'gestor') return err('Apenas gestor pode editar checklist', 403)

    const { id } = await params
    const { phase, itemId, checked, evidence, filePath, fileName } = schema.parse(await req.json())
    const db = createServerClient()

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

    const value = prevObj || evidence || filePath || fileName
      ? {
          checked,
          evidence: evidence ?? prevObj?.evidence,
          filePath: filePath ?? prevObj?.filePath,
          fileName: fileName ?? prevObj?.fileName,
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
