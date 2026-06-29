import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { isSimpleMode } from '@/lib/app-mode'
import { phaseProgress } from '@/lib/checklists'
import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'
import { qcpsAverage } from '@/lib/qcps'
import { checkProjectCap } from '@/lib/estlar/cap'
import { ACTIVE_PIPELINE_STAGES } from '@/lib/pipeline'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const alerts: Array<{ type: string; severity: 'warning' | 'info'; message: string; href?: string }> = []
    const v2 = isSimpleMode()

    const capInfo = await checkProjectCap()
    if (capInfo.atCap) {
      alerts.push({
        type: 'project_cap',
        severity: 'warning',
        message: `Cap trimestral atingido (${capInfo.active}/${capInfo.cap.max} projetos)`,
        href: '/dashboard',
      })
    } else if (!v2 && capInfo.available <= 2) {
      alerts.push({
        type: 'project_cap',
        severity: 'info',
        message: `Apenas ${capInfo.available} vaga(s) no cap trimestral`,
        href: '/pipeline',
      })
    }

    const { count: draftReports } = await db
      .from('weekly_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')

    if ((draftReports ?? 0) > 0) {
      alerts.push({
        type: 'weekly_reports_draft',
        severity: 'info',
        message: `${draftReports} Relatório(s) 360 aguardando revisão`,
        href: '/reports/weekly',
      })
    }

    if (!v2) {
      const { count: intakeReview } = await db
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .in('intake_status', ['review', 'pending'])
        .in('stage', ACTIVE_PIPELINE_STAGES)

      if ((intakeReview ?? 0) > 0) {
        alerts.push({
          type: 'intake_review',
          severity: 'info',
          message: `${intakeReview} intake(s) aguardando revisão`,
          href: '/pipeline?filter=intake',
        })
      }
    }

    if (v2) {
      const [{ count: quotesSent }, { count: quotesApproved }, { count: skuSubmitted }, { count: portalOff }] = await Promise.all([
        db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        db.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('portal_enabled', false),
      ])
      if ((quotesSent ?? 0) > 0) {
        alerts.push({
          type: 'quotes_sent',
          severity: 'info',
          message: `${quotesSent} orçamento(s) aguardando cliente`,
          href: '/quotes',
        })
      }
      if ((quotesApproved ?? 0) > 0) {
        alerts.push({
          type: 'quotes_approved',
          severity: 'warning',
          message: `${quotesApproved} orçamento(s) aprovados — gere os pedidos`,
          href: '/quotes',
        })
      }
      if ((skuSubmitted ?? 0) > 0) {
        alerts.push({
          type: 'sku_submitted',
          severity: 'info',
          message: `${skuSubmitted} SKU(s) aguardando aprovação no catálogo`,
          href: '/products?tab=skus&status=submitted',
        })
      }
      if ((portalOff ?? 0) > 0) {
        alerts.push({
          type: 'portal_off',
          severity: 'info',
          message: `${portalOff} obra(s) sem portal liberado`,
          href: '/projects',
        })
      }
    }

    const { data: suppliers } = await db.from('suppliers').select('id, name, score_q, score_c, score_p, score_s, status')
    for (const s of (suppliers ?? []) as Array<{ id: string; name: string; score_q: number; score_c: number; score_p: number; score_s: number; status: string }>) {
      const avg = qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number })
      if (!v2 && avg < 6) {
        alerts.push({
          type: 'low_qcps',
          severity: 'warning',
          message: `${s.name} com QCPS ${avg}/10 — revisar curadoria`,
          href: '/suppliers',
        })
      }
      if (s.status === 'pending') {
        alerts.push({
          type: 'pending_supplier',
          severity: 'info',
          message: `${s.name} aguarda homologação`,
          href: v2 ? '/suppliers?tab=homologacao' : '/pending-suppliers',
        })
      }
    }

    if (!v2) {
    const { data: projects } = await db.from('projects').select('id, name, phase, status, checklist, updated_at')
    const weekAgo = Date.now() - 7 * 86400000
    for (const p of (projects ?? []) as Array<{ id: string; name: string; phase: ProjectPhase; status: string; checklist: PhaseChecklist; updated_at: string }>) {
      if (p.status !== 'active') continue
      const progress = phaseProgress(p.phase, p.checklist ?? {} as PhaseChecklist)
      if (progress.total > 0 && progress.done < progress.total && new Date(p.updated_at).getTime() < weekAgo) {
        alerts.push({
          type: 'stale_checklist',
          severity: 'warning',
          message: `${p.name} — checklist Fase ${p.phase} parado há 7+ dias`,
          href: '/projects',
        })
      }
    }
    }

    if (!v2) {
    const { count: failedJobs } = await db.from('job_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed')

    if ((failedJobs ?? 0) > 0) {
      alerts.push({
        type: 'failed_jobs',
        severity: 'warning',
        message: `${failedJobs} job(s) falharam — verifique a fila`,
        href: '/jobs',
      })
    }
    }

    const { data: lateOrders } = await db
      .from('orders')
      .select('id, status, created_at, product:products(lead_time_days)')
      .in('status', ['approved', 'processing'])

    for (const o of (lateOrders ?? []) as Array<{
      id: string
      status: string
      created_at: string
      product?: { lead_time_days: number | null }
    }>) {
      const leadDays = o.product?.lead_time_days
      if (!leadDays) continue
      const due = new Date(o.created_at).getTime() + leadDays * 86400000
      if (Date.now() > due) {
        alerts.push({
          type: 'late_order',
          severity: 'warning',
          message: `Pedido ${o.id.slice(0, 8)}… atrasado (${leadDays}d prazo)`,
          href: v2 ? '/quotes?tab=pedidos' : '/orders',
        })
      }
    }

    return ok(alerts)
  } catch (e) {
    return handleError(e)
  }
}
