import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

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
    const db = createServerClient()
    const search = req.nextUrl.searchParams.get('search')

    const { data, error } = await db
      .from('orders')
      .select('*, client:clients(id,name), supplier:suppliers(id,name), product:products(id,name,unit), project:projects(id,name,phase)')
      .order('created_at', { ascending: false })

    if (error) return err(error.message, 500)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = data as any[]
    const filtered = search
      ? rows.filter(o =>
          o.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.project?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : rows

    return ok(filtered, { total: filtered.length })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)
    const db = createServerClient()

    const { data, error } = await (db
      .from('orders')
      .insert({ ...payload, status: 'pending' } as never) as ReturnType<typeof db.from>)
      .select('*, client:clients(id,name), supplier:suppliers(id,name), product:products(id,name,unit), project:projects(id,name,phase)')
      .single()

    if (error) return err(error.message, 500)
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
