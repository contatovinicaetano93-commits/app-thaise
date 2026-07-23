import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { logActivity } from '@/lib/memory/events'
import { jobKey, isJobProcessed, markJobProcessed } from '@/lib/queue/idempotency'
import { dispatchWebhooks } from '@/lib/webhooks/dispatch'
import { notifySupplierSeparation } from '@/lib/notify/supplier-order'

export async function processOrderJob(
  jobType: OrderJobType,
  payload: OrderJobPayload,
  opts?: { force?: boolean },
): Promise<Record<string, unknown>> {
  const key = jobKey(jobType, payload.orderId)
  if (!opts?.force && await isJobProcessed(key)) {
    return { action: 'skipped', reason: 'already_processed', orderId: payload.orderId }
  }

  if (jobType === 'order.approved') {
    const notice = await notifySupplierSeparation(payload.orderId)

    await logActivity({
      entityType: 'order',
      entityId: payload.orderId,
      eventType: 'order.approved',
      title: 'Pedido — separar produto',
      detail: [
        notice.whatsapp.sent ? 'WhatsApp enviado' : notice.whatsapp.wa_link ? 'Link WhatsApp gerado' : 'WhatsApp indisponível',
        notice.email.sent ? 'E-mail enviado' : 'E-mail em stub',
        notice.inApp ? 'Notificação in-app' : '',
      ].filter(Boolean).join(' · '),
      metadata: notice as unknown as Record<string, unknown>,
    })

    const result = {
      action: 'notify_supplier',
      orderId: payload.orderId,
      notice,
      message: 'Fornecedor notificado para separar produto (WhatsApp → e-mail → in-app)',
    }
    await markJobProcessed(key, jobType, payload.orderId, result)
    await dispatchWebhooks('order.approved', result)
    return result
  }

  if (jobType === 'order.delivered') {
    await logActivity({
      entityType: 'order',
      entityId: payload.orderId,
      eventType: 'order.delivered',
      title: 'Pedido entregue',
      detail: 'Pedido marcado como entregue',
      metadata: { supplierId: payload.supplierId, projectId: payload.projectId },
    })

    const result = {
      action: 'delivered',
      orderId: payload.orderId,
    }
    await markJobProcessed(key, jobType, payload.orderId, result)
    await dispatchWebhooks('order.delivered', result)
    return result
  }

  return { action: 'noop' }
}
