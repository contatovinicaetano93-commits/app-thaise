import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createServerClient } from '@/lib/supabase-server'
import { qcpsAverage } from '@/lib/qcps'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = createServerClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [ordersRes, suppliersRes, projectsRes, insightsRes] = await Promise.all([
      db.from('orders').select('id, status, total_price, created_at').gte('created_at', monthStart),
      db.from('suppliers').select('id, name, status, score_q, score_c, score_p, score_s'),
      db.from('projects').select('id, phase, status'),
      db.from('agent_insights').select('id').gte('created_at', monthStart),
    ])

    const orders = ordersRes.data ?? []
    const suppliers = suppliersRes.data ?? []
    const projects = projectsRes.data ?? []

    const revenue = orders
      .filter((o: { status: string }) => o.status === 'delivered')
      .reduce((acc: number, o: { total_price: number }) => acc + Number(o.total_price), 0)

    const activeSuppliers = suppliers.filter((s: { status: string }) => s.status === 'active')
    const avgQcps = activeSuppliers.length
      ? Math.round(activeSuppliers.reduce((acc: number, s: { score_q: number; score_c: number; score_p: number; score_s: number }) =>
          acc + qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number }), 0) / activeSuppliers.length * 10) / 10
      : 0

    const summary = [
      `Relatório ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      `${orders.length} pedido(s) no mês · receita entregue ${revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `${activeSuppliers.length} fornecedor(es) ativo(s) · QCPS médio ${avgQcps}/10`,
      `${projects.filter((p: { status: string }) => p.status === 'active').length} empreendimento(s) ativo(s)`,
      `${insightsRes.data?.length ?? 0} insight(s) AI gerados no mês`,
    ].join(' · ')

    return ok({
      period: { from: monthStart, to: now.toISOString() },
      metrics: {
        orders: orders.length,
        revenue,
        activeSuppliers: activeSuppliers.length,
        avgQcps,
        activeProjects: projects.filter((p: { status: string }) => p.status === 'active').length,
        insights: insightsRes.data?.length ?? 0,
      },
      summary,
    })
  } catch (e) {
    return handleError(e)
  }
}
