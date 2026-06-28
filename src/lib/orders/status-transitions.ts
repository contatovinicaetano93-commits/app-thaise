export type OrderStatus = 'pending' | 'approved' | 'processing' | 'delivered' | 'cancelled'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  processing: 'Em produção',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['processing', 'cancelled'],
  processing: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const FORNECEDOR_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: [],
  approved: ['processing'],
  processing: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function allowedOrderTransitions(
  role: 'gestor' | 'fornecedor' | 'cliente',
  current: OrderStatus,
): OrderStatus[] {
  if (role === 'cliente') return []
  if (role === 'fornecedor') return FORNECEDOR_TRANSITIONS[current] ?? []
  return TRANSITIONS[current] ?? []
}

export function validateOrderTransition(
  role: 'gestor' | 'fornecedor' | 'cliente',
  from: OrderStatus,
  to: OrderStatus,
): string | null {
  if (from === to) return 'Pedido já está neste status'
  if (role === 'cliente') return 'Clientes não podem alterar status de pedidos'
  const allowed = allowedOrderTransitions(role, from)
  if (!allowed.includes(to)) {
    return role === 'fornecedor'
      ? `Fornecedor só pode avançar: ${allowed.map(s => ORDER_STATUS_LABEL[s]).join(' ou ') || 'nenhuma ação'}`
      : `Transição inválida: ${ORDER_STATUS_LABEL[from]} → ${ORDER_STATUS_LABEL[to]}`
  }
  return null
}
