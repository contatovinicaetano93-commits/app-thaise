import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().transform(v => v || null),
  category: z.string().min(2).optional(),
  price: z.number().min(0.01).optional(),
  unit: z.string().min(1).optional(),
  min_order: z.number().int().min(1).optional(),
  lead_time_days: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('products')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Produto não encontrado', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServerClient()
    const { error } = await db.from('products').delete().eq('id', id)
    if (error) return err(error.message, 500)
    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
