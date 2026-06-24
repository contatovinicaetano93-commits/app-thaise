import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireProfile } from '@/lib/auth/api-context'
import { enqueueOrderJob } from '@/lib/queue'
import { logActivity, logOrderStatus } from '@/lib/memory/events'

const schema = z.object({
  status: z.enum(['pending', 'approved', 'processing', 'delivered', 'cancelled']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const { status } = schema.parse(body)
    const db = createServerClient()

    const { data: prev } = await db.from('orders').select('status, supplier_id, client_id').eq('id', id).single() as {
      data: { status: string; supplier_id: string; client_id: string } | null
    }

    if (!prev) return err('Pedido não encontrado', 404)

    if (profile!.role === 'fornecedor' && profile!.supplier_id !== prev.supplier_id) {
      return err('Acesso negado a este pedido', 403)
    }
    if (profile!.role === 'cliente' && profile!.client_id !== prev.client_id) {
      return err('Acesso negado a este pedido', 403)
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

    if (prev.status !== status) {
      await logOrderStatus({
        orderId: order.id,
        fromStatus: prev.status,
        toStatus: status,
        changedBy: profile!.id,
      })
      await logActivity({
        entityType: 'order',
        entityId: order.id,
        eventType: 'order.status_changed',
        title: `Status: ${prev.status} → ${status}`,
        actorId: profile!.id,
      })
    }

    if (prev.status !== 'approved' && status === 'approved') {
      enqueueOrderJob('order.approved', {
        orderId: order.id,
        supplierId: order.supplier_id,
        clientId: order.client_id,
        projectId: order.project_id,
      }).catch(console.error)
    }

    if (prev.status !== 'delivered' && status === 'delivered') {
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
