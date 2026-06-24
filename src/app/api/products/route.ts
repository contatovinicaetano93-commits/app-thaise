import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireProfile } from '@/lib/auth/api-context'
import { assertActiveSupplier } from '@/lib/gates'
import { logActivity } from '@/lib/memory/events'

const schema = z.object({
  supplier_id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().transform(v => v || null),
  category: z.string().min(2),
  price: z.number().min(0.01),
  unit: z.string().default('un'),
  min_order: z.number().int().min(1).optional(),
  lead_time_days: z.number().int().min(0).optional(),
  active: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = createServerClient()
    const supplierId = req.nextUrl.searchParams.get('supplier_id')
      ?? (profile!.role === 'fornecedor' ? profile!.supplier_id : null)

    let query = db.from('products').select('*, supplier:suppliers(id,name)').order('name')
    if (supplierId) query = query.eq('supplier_id', supplierId)

    const { data, error } = await query
    if (error) return err(error.message, 500)
    return ok(data, { total: data.length })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const body = await req.json()
    const payload = schema.parse(body)

    if (profile!.role === 'fornecedor' && profile!.supplier_id !== payload.supplier_id) {
      return err('Fornecedor só pode cadastrar produtos próprios', 403)
    }
    if (profile!.role === 'cliente') return err('Cliente não pode cadastrar produtos', 403)

    await assertActiveSupplier(payload.supplier_id)

    const db = createServerClient()

    const { data, error } = await db
      .from('products')
      .insert(payload as never)
      .select()
      .single()

    if (error) return err(error.message, 500)

    const product = data as { id: string; name: string }
    await logActivity({
      entityType: 'product',
      entityId: product.id,
      eventType: 'product.created',
      title: 'Produto cadastrado',
      detail: product.name,
      actorId: profile!.id,
    })

    return ok(data, undefined, 201)
  } catch (e) {
    if (e instanceof Error && e.message.includes('ativo')) return err(e.message, 422)
    return handleError(e)
  }
}
