import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

const schema = z.object({
  status: z.enum(['pending', 'approved', 'processing', 'delivered', 'cancelled']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status } = schema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('orders')
      .update({ status } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Pedido não encontrado', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
