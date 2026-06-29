import { createServiceClient } from '@/lib/supabase-server'
import { phaseIndex, PHASE_ORDER } from '@/lib/phases'
import type { ProjectPhase } from '@/lib/phases'

async function loadProjectV2(db: ReturnType<typeof createServiceClient>, projectId: string) {
  const { data } = await db
    .from('projects')
    .select(`
      name, phase, status, checklist, progress_pct, current_phase_id,
      current_phase:project_phases(name)
    `)
    .eq('id', projectId)
    .single()

  return data as {
    name: string
    phase: ProjectPhase
    status: string
    checklist?: Record<string, unknown>
    progress_pct?: number | null
    current_phase_id?: string | null
    current_phase?: { name: string } | null
  } | null
}

export interface WeeklyReportDraft {
  weekLabel: string
  weekStart: string
  completed: string[]
  nextSteps: string[]
  risks: string
  schedulePct: number
  budgetStatus: string
}

function getWeekStart(d = new Date()): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatWeekLabel(start: Date): string {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `Semana ${fmt(start)} – ${fmt(end)}`
}

export async function generateWeeklyReportDraft(projectId: string): Promise<WeeklyReportDraft> {
  const db = createServiceClient()
  const weekStart = getWeekStart()
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const proj = await loadProjectV2(db, projectId)
  if (!proj) throw new Error('Empreendimento não encontrado')

  const { data: events } = await db
    .from('activity_events')
    .select('title, detail, event_type, created_at')
    .eq('entity_type', 'project')
    .eq('entity_id', projectId)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: orders } = await db
    .from('orders')
    .select('status, total_price, updated_at')
    .eq('project_id', projectId)

  const orderRows = (orders ?? []) as Array<{ status: string; total_price: number; updated_at: string }>
  const delivered = orderRows.filter(o => o.status === 'delivered')
  const pending = orderRows.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const weekDelivered = delivered.filter(o => new Date(o.updated_at) >= weekStart)

  const completed: string[] = weekDelivered.length > 0
    ? weekDelivered.map(o => `Pedido entregue — R$ ${o.total_price.toLocaleString('pt-BR')}`)
    : (events ?? []).slice(0, 3).map(e => {
        const ev = e as { title: string; detail?: string }
        return ev.detail ? `${ev.title}: ${ev.detail}` : ev.title
      })

  const phaseName = proj.current_phase?.name
  const progressPct = proj.progress_pct != null ? Number(proj.progress_pct) : null

  if (completed.length === 0) {
    if (phaseName && progressPct != null) {
      completed.push(`${proj.name} — ${phaseName} (${progressPct.toFixed(0)}%)`)
    } else {
      completed.push(`Empreendimento em Fase ${proj.phase} — ${proj.name}`)
    }
  }

  const phaseIdx = phaseIndex(proj.phase)
  const schedulePct = progressPct != null
    ? Math.round(progressPct)
    : Math.round(((phaseIdx + 0.5) / PHASE_ORDER.length) * 100)

  const nextSteps: string[] = []
  if (proj.status === 'active') {
    if (phaseName) {
      nextSteps.push(`Continuar fase: ${phaseName}`)
    } else {
      nextSteps.push(`Avançar entregas da Fase ${proj.phase}`)
    }
    if (pending.length > 0) nextSteps.push(`${pending.length} pedido(s) em andamento`)
    if (!phaseName) {
      const nextPhase = PHASE_ORDER[phaseIdx + 1]
      if (nextPhase) nextSteps.push(`Preparar transição para Fase ${nextPhase}`)
    }
  }

  const { data: diary } = await db
    .from('project_diary_entries')
    .select('risks, planned, actual')
    .eq('project_id', projectId)
    .eq('week_start', weekStartStr)
    .maybeSingle()

  const diaryRow = diary as { risks?: string; planned?: string; actual?: string } | null
  const risks = diaryRow?.risks
    ?? (pending.length > 3
      ? `${pending.length} pedidos pendentes — monitorar prazos com fornecedores homologados.`
      : 'Nenhum risco crítico identificado. Cronograma dentro do previsto.')

  const monthSpend = orderRows
    .filter(o => {
      const d = new Date(o.updated_at)
      return d.getMonth() === new Date().getMonth() && o.status === 'delivered'
    })
    .reduce((s, o) => s + o.total_price, 0)

  const budgetStatus = monthSpend > 0
    ? `R$ ${monthSpend.toLocaleString('pt-BR')} investidos no mês — dentro do orçamento previsto`
    : 'Sem desembolsos registrados neste mês'

  return {
    weekLabel: formatWeekLabel(weekStart),
    weekStart: weekStartStr,
    completed,
    nextSteps,
    risks,
    schedulePct,
    budgetStatus,
  }
}

export async function upsertWeeklyReportDraft(projectId: string) {
  const db = createServiceClient()
  const draft = await generateWeeklyReportDraft(projectId)

  const { data, error } = await db
    .from('weekly_reports')
    .upsert({
      project_id: projectId,
      week_label: draft.weekLabel,
      week_start: draft.weekStart,
      completed: draft.completed,
      next_steps: draft.nextSteps,
      risks: draft.risks,
      schedule_pct: draft.schedulePct,
      budget_status: draft.budgetStatus,
      status: 'draft',
      generated_at: new Date().toISOString(),
    } as never, { onConflict: 'project_id,week_start' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export function formatWeeklyReportEmail(params: {
  clientName: string
  projectName: string
  report: WeeklyReportDraft
}): string {
  const lines = [
    `Atualização Executiva — Projeto ${params.projectName}`,
    params.report.weekLabel,
    '',
    '✅ O que foi concluído esta semana:',
    ...params.report.completed.map(c => `  • ${c}`),
    '',
    '🎯 Próximos passos:',
    ...params.report.nextSteps.map(s => `  • ${s}`),
    '',
    '🛡️ Gestão de Riscos:',
    `  ${params.report.risks}`,
    '',
    '📊 Status:',
    `  Cronograma: ${params.report.schedulePct}% concluído`,
    `  Financeiro: ${params.report.budgetStatus}`,
    '',
    `Olá, ${params.clientName}. Bom final de semana!`,
    'Thaise Resende | Estlar',
  ]
  return lines.join('\n')
}

export async function generateAllWeeklyReports(): Promise<{ generated: number; errors: string[] }> {
  const db = createServiceClient()
  const { data: projects } = await db
    .from('projects')
    .select('id')
    .eq('status', 'active')

  let generated = 0
  const errors: string[] = []

  for (const p of projects ?? []) {
    try {
      await upsertWeeklyReportDraft((p as { id: string }).id)
      generated++
    } catch (e) {
      errors.push(`${(p as { id: string }).id}: ${e instanceof Error ? e.message : 'erro'}`)
    }
  }

  return { generated, errors }
}
