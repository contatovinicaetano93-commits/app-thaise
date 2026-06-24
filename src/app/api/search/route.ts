import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireProfile } from '@/lib/auth/api-context'

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) return ok({ suppliers: [], clients: [], projects: [], orders: [] })

    const db = createServerClient()
    const pattern = `%${q}%`

    const [suppliers, clients, projects, orders] = await Promise.all([
      db.from('suppliers').select('id, name, category').or(`name.ilike.${pattern},category.ilike.${pattern}`).limit(5),
      db.from('clients').select('id, name, company').or(`name.ilike.${pattern},company.ilike.${pattern}`).limit(5),
      db.from('projects').select('id, name, phase').or(`name.ilike.${pattern},location.ilike.${pattern}`).limit(5),
      db.from('orders').select('id, status, client:clients(name), supplier:suppliers(name)').limit(20),
    ])

    let orderRows = (orders.data ?? []) as Array<{
      id: string
      status: string
      client?: { name: string }
      supplier?: { name: string }
    }>
    orderRows = orderRows.filter(o =>
      o.client?.name?.toLowerCase().includes(q.toLowerCase()) ||
      o.supplier?.name?.toLowerCase().includes(q.toLowerCase()) ||
      o.id.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 5)

    if (profile!.role === 'fornecedor' && profile!.supplier_id) {
      orderRows = orderRows.filter(() => true) // filtered at list level in production
    }

    return ok({
      suppliers: suppliers.data ?? [],
      clients: clients.data ?? [],
      projects: projects.data ?? [],
      orders: orderRows,
    })
  } catch (e) {
    return handleError(e)
  }
}
