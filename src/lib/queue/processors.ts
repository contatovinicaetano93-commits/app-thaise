import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { createServiceClient } from '@/lib/supabase-server'
import { scoreSupplier } from '@/lib/agents/scoring-agent'
import { logActivity } from '@/lib/memory/events'
import { jobKey, isJobProcessed, markJobProcessed } from '@/lib/queue/idempotency'

export async function processOrderJob(
  jobType: OrderJobType,
  payload: OrderJobPayload,
): Promise<Record<string, unknown>> {
  const key = jobKey(jobType, payload.orderId)
  if (await isJobProcessed(key)) {
    return { action: 'skipped', reason: 'already_processed', orderId: payload.orderId }
  }

  const db = createServiceClient()

  if (jobType === 'order.approved') {
    const { data: supplier } = await db
      .from('suppliers')
      .select('contact_email, name')
      .eq('id', payload.supplierId)
      .single() as { data: { contact_email: string; name: string } | null }

    const emailStub = {
      to: supplier?.contact_email ?? 'fornecedor@exemplo.com',
      subject: `Nova OS — Pedido ${payload.orderId.slice(0, 8)}`,
      body: `Olá ${supplier?.name ?? 'Fornecedor'}, um pedido foi aprovado e aguarda produção.`,
      sent_at: new Date().toISOString(),
      provider: 'stub',
    }

    console.info(`[email-stub]`, emailStub)

    await logActivity({
      entityType: 'order',
      entityId: payload.orderId,
      eventType: 'order.approved',
      title: 'Pedido aprovado — OS enviada',
      detail: `Notificação para ${emailStub.to}`,
      metadata: { emailStub },
    })

    const result = {
      action: 'notify_supplier',
      orderId: payload.orderId,
      supplierEmail: supplier?.contact_email,
      emailStub,
      message: 'Ordem de serviço enfileirada para o fornecedor',
    }
    await markJobProcessed(key, jobType, payload.orderId, result)
    return result
  }

  if (jobType === 'order.delivered') {
    const scoring = await scoreSupplier(payload.supplierId)

    if (payload.projectId) {
      const { scoreProject } = await import('@/lib/agents/scoring-agent')
      await scoreProject(payload.projectId)
    }

    await logActivity({
      entityType: 'order',
      entityId: payload.orderId,
      eventType: 'order.delivered',
      title: 'Pedido entregue — QCPS atualizado',
      detail: `Score fornecedor: ${scoring.average}/10`,
      metadata: { scoring },
    })

    const result = {
      action: 'score_and_close',
      orderId: payload.orderId,
      scoring,
    }
    await markJobProcessed(key, jobType, payload.orderId, result)
    return result
  }

  return { action: 'noop' }
}
