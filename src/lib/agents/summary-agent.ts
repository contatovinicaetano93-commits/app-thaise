import { createServiceClient } from '@/lib/supabase-server'
import { phaseProgress } from '@/lib/checklists'
import { PHASES } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'

export async function summarizeProject(projectId: string) {
  const db = createServiceClient()
  const { data: project } = await db
    .from('projects')
    .select('*, client:clients(name)')
    .eq('id', projectId)
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

  if (!project) throw new Error('Empreendimento não encontrado')

  const { data: orders } = await db
    .from('orders')
    .select('status, total_price')
    .eq('project_id', projectId)

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

  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Resuma em 3 frases objetivas para o cliente final, em português.' },
            { role: 'user', content: lines.join('\n') },
          ],
          max_tokens: 200,
        }),
      })
      const json = await res.json()
      const ai = json.choices?.[0]?.message?.content
      if (ai) insight = ai
    } catch {
      // mantém resumo determinístico
    }
  }

  await db.from('agent_insights').insert({
    entity_type: 'project',
    entity_id: projectId,
    insight,
    scores: null,
  } as never)

  return { summary: insight, stats: { totalPedidos, valorTotal, progress } }
}

export function evaluateProjectRisk(input: {
  phase: ProjectPhase
  checklist: PhaseChecklist
  scoreQ: number
  openOrders: number
}): { nivel: 'baixo' | 'medio' | 'alto'; motivos: string[] } {
  const motivos: string[] = []
  const progress = phaseProgress(input.phase, input.checklist)

  if (progress.total > 0 && progress.done / progress.total < 0.5) {
    motivos.push('Checklist da fase abaixo de 50%')
  }
  if (input.scoreQ < 6) motivos.push('QCPS Qualidade abaixo de 6')
  if (input.openOrders > 5) motivos.push('Muitos pedidos em aberto')

  const nivel = motivos.length >= 2 ? 'alto' : motivos.length === 1 ? 'medio' : 'baixo'
  return { nivel, motivos }
}
