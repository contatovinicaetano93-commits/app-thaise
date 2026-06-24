import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createServerClient } from '@/lib/supabase-server'
import { phaseProgress } from '@/lib/checklists'
import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'
import { qcpsAverage } from '@/lib/qcps'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = createServerClient()
    const alerts: Array<{ type: string; severity: 'warning' | 'info'; message: string; href?: string }> = []

    const { data: suppliers } = await db.from('suppliers').select('id, name, score_q, score_c, score_p, score_s, status')
    for (const s of (suppliers ?? []) as Array<{ id: string; name: string; score_q: number; score_c: number; score_p: number; score_s: number; status: string }>) {
      const avg = qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number })
      if (avg < 6) {
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
          href: '/pending-suppliers',
        })
      }
    }

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

    const { count: failedJobs } = await db.from('job_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed')

    if ((failedJobs ?? 0) > 0) {
      alerts.push({
        type: 'failed_jobs',
        severity: 'warning',
        message: `${failedJobs} job(s) falharam — verifique a fila`,
        href: '/jobs',
      })
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
          href: '/orders',
        })
      }
    }

    return ok(alerts)
  } catch (e) {
    return handleError(e)
  }
}
