import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { checkProjectCap } from '@/lib/estlar/cap'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const alerts: Array<{ type: string; severity: 'warning' | 'info'; message: string; href?: string }> = []

    const capInfo = await checkProjectCap()
    if (capInfo.atCap) {
      alerts.push({
        type: 'project_cap',
        severity: 'warning',
        message: `Cap trimestral atingido (${capInfo.active}/${capInfo.cap.max} projetos)`,
        href: '/dashboard',
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

    const [{ count: quotesSent }, { count: quotesApproved }, { count: skuSubmitted }] = await Promise.all([
      db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
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

    const { data: suppliers } = await db.from('suppliers').select('id, name, status')
    for (const s of (suppliers ?? []) as Array<{ id: string; name: string; status: string }>) {
      if (s.status === 'pending') {
        alerts.push({
          type: 'pending_supplier',
          severity: 'info',
          message: `${s.name} aguarda homologação`,
          href: '/suppliers?tab=homologacao',
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
          href: '/quotes?tab=pedidos',
        })
      }
    }

    return ok(alerts)
  } catch (e) {
    return handleError(e)
  }
}
