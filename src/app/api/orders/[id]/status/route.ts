import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { enqueueOrderJob } from '@/lib/queue'

const schema = z.object({
  status: z.enum(['pending', 'approved', 'processing', 'delivered', 'cancelled']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status } = schema.parse(body)
    const db = createServerClient()

    const { data: prev } = await db.from('orders').select('status').eq('id', id).single() as {
      data: { status: string } | null
    }

    const { data, error } = await db
      .from('orders')
      .update({ status } as never)
      .eq('id', id)
      .select('*, client:clients(id,name), supplier:suppliers(id,name), product:products(id,name,unit), project:projects(id,name,phase)')
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Pedido não encontrado', 404)

    const order = data as {
      id: string
      supplier_id: string
      client_id: string
      project_id?: string | null
      status: string
    }

    if (prev?.status !== 'approved' && status === 'approved') {
      enqueueOrderJob('order.approved', {
        orderId: order.id,
        supplierId: order.supplier_id,
        clientId: order.client_id,
        projectId: order.project_id,
      }).catch(console.error)
    }

    if (prev?.status !== 'delivered' && status === 'delivered') {
      enqueueOrderJob('order.delivered', {
        orderId: order.id,
        supplierId: order.supplier_id,
        clientId: order.client_id,
        projectId: order.project_id,
      }).catch(console.error)
    }

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
