import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, filterProductsByRole } from '@/lib/auth/api-context'

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) return ok({ suppliers: [], clients: [], projects: [], orders: [], products: [] })

    const db = await createSupabaseServer()
    const pattern = `%${q}%`

    const [suppliers, clients, projects, orders, products] = await Promise.all([
      db.from('suppliers').select('id, name, category').or(`name.ilike.${pattern},category.ilike.${pattern}`).limit(5),
      db.from('clients').select('id, name, company').or(`name.ilike.${pattern},company.ilike.${pattern}`).limit(5),
      db.from('projects').select('id, name, phase').or(`name.ilike.${pattern},location.ilike.${pattern}`).limit(5),
      db.from('orders').select('id, status, client:clients(name), supplier:suppliers(name)').limit(20),
      db.from('products').select('id, name, category, supplier_id').or(`name.ilike.${pattern},category.ilike.${pattern}`).limit(10),
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
      orderRows = orderRows.filter(() => true)
    }

    const productRows = filterProductsByRole(
      (products.data ?? []) as Array<{ id: string; name: string; category: string; supplier_id: string }>,
      profile!.role,
      profile!,
    ).slice(0, 5)

    type ClientRow = { id: string; name: string; company?: string | null }
    let clientRows = (clients.data ?? []) as ClientRow[]
    if (profile!.role === 'cliente' && profile!.client_id) {
      clientRows = clientRows.filter(c => c.id === profile!.client_id)
    }

    return ok({
      suppliers: suppliers.data ?? [],
      clients: clientRows,
      projects: projects.data ?? [],
      orders: orderRows,
      products: productRows,
    })
  } catch (e) {
    return handleError(e)
  }
}
