/** Labels de status de pedido de SKU, ajustadas por papel. */
export function skuRequestStatusLabel(
  status: string,
  role: 'gestor' | 'fornecedor' | 'cliente' | null | undefined,
): string {
  if (role === 'fornecedor') {
    switch (status) {
      case 'open':
        return 'Aguardando seu cadastro'
      case 'submitted':
        return 'Aguardando aprovação da Estlar'
      case 'approved':
        return 'Aprovado no catálogo'
      case 'rejected':
        return 'Rejeitado — aguarde novo pedido'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  switch (status) {
    case 'open':
      return 'Aguardando fornecedor'
    case 'submitted':
      return 'Aguardando sua aprovação'
    case 'approved':
      return 'Aprovado no catálogo'
    case 'rejected':
      return 'Rejeitado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}
