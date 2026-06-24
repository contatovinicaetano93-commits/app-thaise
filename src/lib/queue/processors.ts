import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { createServiceClient } from '@/lib/supabase-server'
import { scoreSupplier } from '@/lib/agents/scoring-agent'

export async function processOrderJob(
  jobType: OrderJobType,
  payload: OrderJobPayload,
): Promise<Record<string, unknown>> {
  const db = createServiceClient()

  if (jobType === 'order.approved') {
    const { data: supplier } = await db
      .from('suppliers')
      .select('contact_email, name')
      .eq('id', payload.supplierId)
      .single() as { data: { contact_email: string; name: string } | null }

    // Simula notificação ao fornecedor (OS disparada)
    console.info(`[OS] Notificação enviada para ${supplier?.contact_email ?? 'fornecedor'} — pedido ${payload.orderId}`)

    return {
      action: 'notify_supplier',
      orderId: payload.orderId,
      supplierEmail: supplier?.contact_email,
      message: 'Ordem de serviço enfileirada para o fornecedor',
    }
  }

  if (jobType === 'order.delivered') {
    const scoring = await scoreSupplier(payload.supplierId)

    if (payload.projectId) {
      const { scoreProject } = await import('@/lib/agents/scoring-agent')
      await scoreProject(payload.projectId)
    }

    return {
      action: 'score_and_close',
      orderId: payload.orderId,
      scoring,
    }
  }

  return { action: 'noop' }
}
