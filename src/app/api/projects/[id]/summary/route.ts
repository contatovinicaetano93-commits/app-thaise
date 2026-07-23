import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { chatCompletion } from '@/lib/llm'
import { createServiceClient } from '@/lib/supabase-server'
import { phaseProgress } from '@/lib/checklists'
import { PHASES, type ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const db = createServiceClient()
    const { data: project } = await db
      .from('projects')
      .select('*, client:clients(name)')
      .eq('id', id)
      .single() as {
      data: {
        id: string
        name: string
        phase: ProjectPhase
        status: string
        location?: string | null
        checklist: PhaseChecklist
        client?: { name: string }
      } | null
    }

    if (!project) return err('Empreendimento não encontrado', 404)

    const { data: orders } = await db
      .from('orders')
      .select('status, total_price')
      .eq('project_id', id)

    const orderRows = (orders ?? []) as Array<{ status: string; total_price: number }>
    const totalPedidos = orderRows.length
    const valorTotal = orderRows.reduce((a, o) => a + Number(o.total_price), 0)
    const progress = phaseProgress(project.phase, project.checklist ?? {} as PhaseChecklist)
    const phaseInfo = PHASES.find(p => p.id === project.phase)

    const lines = [
      `**${project.name}** — Fase ${project.phase} (${phaseInfo?.label ?? ''})`,
      project.client ? `Cliente: ${project.client.name}` : '',
      project.location ? `Local: ${project.location}` : '',
      `Status: ${project.status}`,
      `Checklist: ${progress.done}/${progress.total} itens concluídos na fase atual`,
      `Pedidos vinculados: ${totalPedidos} (${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
    ].filter(Boolean)

    let insight = lines.join('\n')
    const ai = await chatCompletion([
      { role: 'system', content: 'Resuma em 3 frases objetivas para o cliente final, em português.' },
      { role: 'user', content: lines.join('\n') },
    ], { maxTokens: 200 })
    if (ai) insight = ai

    return ok({ summary: insight, stats: { totalPedidos, valorTotal, progress } })
  } catch (e) {
    return handleError(e)
  }
}
