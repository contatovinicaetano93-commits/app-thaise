import { createServiceClient } from '@/lib/supabase-server'

export interface ProjectIntelligence {
  project_id: string
  progress_pct: number
  current_phase: string | null
  summary: string
  highlights: string[]
  stats: {
    open_orders: number
    delivered_orders: number
    approved_quotes: number
    pending_skus: number
    week_events: number
  }
  generated_at: string
}

export async function buildProjectIntelligence(projectId: string): Promise<ProjectIntelligence> {
  const db = createServiceClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: project } = await db
    .from('projects')
    .select('id, name, progress_pct, current_phase_id, portal_enabled')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Obra não encontrada')

  const proj = project as { id: string; name: string; progress_pct: number; current_phase_id: string | null }

  let currentPhase: string | null = null
  if (proj.current_phase_id) {
    const { data: phase } = await db
      .from('project_phases')
      .select('name')
      .eq('id', proj.current_phase_id)
      .single() as { data: { name: string } | null }
    currentPhase = phase?.name ?? null
  }

  const [{ count: openOrders }, { count: deliveredOrders }, { count: approvedQuotes }, { count: pendingSkus }, { data: events }] = await Promise.all([
    db.from('orders').select('id', { count: 'exact', head: true }).eq('project_id', projectId).not('status', 'in', '(delivered,cancelled)'),
    db.from('orders').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'delivered'),
    db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'approved'),
    db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('project_id', projectId).in('status', ['open', 'submitted']),
    db.from('activity_events')
      .select('title, detail, event_type, created_at')
      .eq('entity_type', 'project')
      .eq('entity_id', projectId)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const highlights = (events ?? []).slice(0, 5).map(e => {
    const ev = e as { title: string; detail?: string }
    return ev.detail ? `${ev.title} — ${ev.detail}` : ev.title
  })

  const progress = Number(proj.progress_pct ?? 0)
  const phaseLabel = currentPhase ?? 'em definição'

  const summaryParts = [
    `Obra ${proj.name} com ${progress.toFixed(0)}% de avanço.`,
    `Fase atual: ${phaseLabel}.`,
    openOrders ? `${openOrders} pedido(s) em andamento.` : 'Sem pedidos abertos.',
    approvedQuotes ? `${approvedQuotes} orçamento(s) aprovado(s) pelo cliente.` : null,
  ].filter(Boolean)

  return {
    project_id: projectId,
    progress_pct: progress,
    current_phase: currentPhase,
    summary: summaryParts.join(' '),
    highlights,
    stats: {
      open_orders: openOrders ?? 0,
      delivered_orders: deliveredOrders ?? 0,
      approved_quotes: approvedQuotes ?? 0,
      pending_skus: pendingSkus ?? 0,
      week_events: (events ?? []).length,
    },
    generated_at: new Date().toISOString(),
  }
}

/** Atualiza rascunho do Relatório 360 com dados atuais da obra. */
export async function refreshProjectReport(projectId: string) {
  const { upsertWeeklyReportDraft } = await import('@/lib/estlar/weekly-report')
  return upsertWeeklyReportDraft(projectId)
}
