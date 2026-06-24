import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireProfile, filterOrdersByRole } from '@/lib/auth/api-context'
import { assertActiveSupplier, assertProductForSupplier } from '@/lib/gates'
import { logActivity, logOrderStatus } from '@/lib/memory/events'

const schema = z.object({
  project_id: z.string().uuid().optional().nullable().transform(v => v || null),
  client_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0.01),
  notes: z.string().optional().transform(v => v || null),
})

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = createServerClient()
    const search = req.nextUrl.searchParams.get('search')
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 100)
    const cursor = req.nextUrl.searchParams.get('cursor')

    let query = db
      .from('orders')
      .select('*, client:clients(id,name), supplier:suppliers(id,name), product:products(id,name,unit), project:projects(id,name,phase)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (cursor) query = query.lt('created_at', cursor)

    const { data, error } = await query
    if (error) return err(error.message, 500)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows = data as any[]
    rows = filterOrdersByRole(rows, profile!.role, profile!)

    const filtered = search
      ? rows.filter(o =>
          o.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.project?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : rows

    const nextCursor = filtered.length === limit ? filtered[filtered.length - 1]?.created_at : null

    return ok(filtered, { total: filtered.length, nextCursor })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'gestor') return err('Apenas gestor pode criar pedidos', 403)

    const body = await req.json()
    const payload = schema.parse(body)

    await assertActiveSupplier(payload.supplier_id)
    await assertProductForSupplier(payload.product_id, payload.supplier_id)

    const db = createServerClient()

    const { data, error } = await (db
      .from('orders')
      .insert({ ...payload, status: 'pending' } as never) as ReturnType<typeof db.from>)
      .select('*, client:clients(id,name), supplier:suppliers(id,name), product:products(id,name,unit), project:projects(id,name,phase)')
      .single()

    if (error) return err(error.message, 500)

    const order = data as { id: string }
    await logOrderStatus({ orderId: order.id, fromStatus: null, toStatus: 'pending', changedBy: profile!.id })
    await logActivity({
      entityType: 'order',
      entityId: order.id,
      eventType: 'order.created',
      title: 'Pedido criado',
      actorId: profile!.id,
    })

    return ok(data, undefined, 201)
  } catch (e) {
    if (e instanceof Error && !e.message.includes('inválid')) {
      return err(e.message, 422)
    }
    return handleError(e)
  }
}
