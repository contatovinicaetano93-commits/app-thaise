import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { evaluateProjectRisk } from '@/lib/agents/summary-agent'
import type { PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const db = await createSupabaseServer()

    const { data: project } = await db
      .from('projects')
      .select('phase, checklist, score_q')
      .eq('id', id)
      .single() as { data: { phase: ProjectPhase; checklist: PhaseChecklist; score_q: number } | null }

    if (!project) return err('Empreendimento não encontrado', 404)

    const { count } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
      .in('status', ['pending', 'approved', 'processing'])

    const risk = evaluateProjectRisk({
      phase: project.phase,
      checklist: project.checklist ?? {} as PhaseChecklist,
      scoreQ: project.score_q,
      openOrders: count ?? 0,
    })

    return ok(risk)
  } catch (e) {
    return handleError(e)
  }
}
