import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'

const schema = z.object({
  phase: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  itemId: z.string(),
  checked: z.boolean(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { phase, itemId, checked } = schema.parse(await req.json())
    const db = createServerClient()

    const { data: project, error: fetchErr } = await db
      .from('projects')
      .select('checklist, phase')
      .eq('id', id)
      .single() as { data: { checklist: PhaseChecklist; phase: ProjectPhase } | null; error: { message: string } | null }

    if (fetchErr || !project) return err('Empreendimento não encontrado', 404)
    if (project.phase !== phase) return err('Só é possível editar o checklist da fase atual', 400)

    const checklist = { ...(project.checklist ?? {}) } as PhaseChecklist
    checklist[phase] = { ...(checklist[phase] ?? {}), [itemId]: checked }

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
