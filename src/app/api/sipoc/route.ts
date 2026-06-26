import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { SIPOC } from '@/lib/sipoc'
import { qcpsAverage } from '@/lib/qcps'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const [suppliers, clients, products, projects, orders] = await Promise.all([
      db.from('suppliers').select('id, status, score_q, score_c, score_p, score_s'),
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('products').select('id, active', { count: 'exact' }),
      db.from('projects').select('id, phase, status'),
      db.from('orders').select('id, status, total_price'),
    ])

    const supplierRows = (suppliers.data ?? []) as Array<{
      id: string; status: string; score_q: number; score_c: number; score_p: number; score_s: number
    }>
    const orderRows = (orders.data ?? []) as Array<{ status: string; total_price: number }>
    const projectRows = (projects.data ?? []) as Array<{ phase: string; status: string }>
    const productRows = (products.data ?? []) as Array<{ active: boolean }>

    const delivered = orderRows.filter(o => o.status === 'delivered')
    const activeProjects = projectRows.filter(p => p.status === 'active')

    return ok({
      map: SIPOC,
      metrics: {
        S: {
          label: SIPOC.suppliers.label,
          total: supplierRows.length,
          active: supplierRows.filter(s => s.status === 'active').length,
          pending: supplierRows.filter(s => s.status === 'pending').length,
        },
        I: {
          label: SIPOC.inputs.label,
          clients: clients.count ?? 0,
          products: productRows.length,
          activeProducts: productRows.filter(p => p.active).length,
          projects: projectRows.length,
        },
        P: {
          label: SIPOC.process.label,
          activeProjects: activeProjects.length,
          openOrders: orderRows.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
        },
        O: {
          label: SIPOC.outputs.label,
          deliveredOrders: delivered.length,
          revenue: delivered.reduce((a, o) => a + Number(o.total_price), 0),
          completedProjects: projectRows.filter(p => p.status === 'completed').length,
        },
        C: {
          label: SIPOC.customers.label,
          total: clients.count ?? 0,
        },
      },
      topSuppliers: supplierRows
        .map(s => ({ id: s.id, score: qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number }) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    })
  } catch (e) {
    return handleError(e)
  }
}
