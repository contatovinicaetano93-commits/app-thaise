export type OrderJobType = 'order.approved' | 'order.delivered'

export interface OrderJobPayload {
  orderId: string
  supplierId: string
  clientId: string
  projectId?: string | null
  jobLogId?: string
}

export const ORDER_QUEUE_NAME = 'orders'
