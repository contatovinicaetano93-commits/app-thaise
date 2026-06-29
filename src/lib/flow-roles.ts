import type { UserRole } from '@/lib/auth/roles'

/** Papéis alinhados ao fluxo canônico Estlar (SIPOC). */
export const ROLE_CANON: Record<UserRole, {
  title: string
  mission: string
  /** O que este papel faz no fluxo — uma linha */
  does: string
  /** O que não faz — evita gaps de expectativa */
  doesNot: string
}> = {
  gestor: {
    title: 'Gestora Estlar',
    mission: 'Hub interno de curadoria — escolhe o melhor produto entre fornecedores homologados para cada obra.',
    does: 'Fecha obra → homologa fornecedor → catálogo curado → pedido → Relatório 360 ao cliente',
    doesNot: 'Fornecedor inputa produtos; cliente só observa.',
  },
  fornecedor: {
    title: 'Fornecedor homologado',
    mission: 'Entrada qualificada (S) — catálogo e execução dos pedidos aprovados.',
    does: 'Cadastra produtos no catálogo · responde pedidos da Estlar',
    doesNot: 'Não vê pipeline, obras de outros clientes nem homologa a si mesmo.',
  },
  cliente: {
    title: 'Cliente investidor',
    mission: 'Observa a jornada da obra com transparência (C).',
    does: 'Acompanha empreendimento (fases A→F), pedidos e Relatório 360 enviado',
    doesNot: 'Somente leitura — não cadastra fornecedores, produtos nem avança fases.',
  },
}

export function navLabelForRole(baseLabel: string, href: string, role: UserRole): string {
  if (href === '/products') {
    return role === 'gestor' ? 'Catálogo curado' : 'Meu catálogo'
  }
  if (href === '/projects') {
    return role === 'cliente' ? 'Minha obra' : 'Empreendimentos'
  }
  if (href === '/orders') {
    return role === 'fornecedor' ? 'Meus pedidos' : role === 'cliente' ? 'Meus pedidos' : 'Pedidos'
  }
  if (href === '/reports/weekly') {
    return role === 'cliente' ? 'Relatório 360' : 'Relatório 360'
  }
  return baseLabel
}
