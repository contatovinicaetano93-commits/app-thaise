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
    mission: 'Opera a obra: homologa fornecedores, pede SKUs, orça, executa pedidos e reporta ao cliente.',
    does: 'Cadastra obra → homologa fornecedor → pede SKU → orça → pedido → relatório',
    doesNot: 'Fornecedor cadastra SKU; cliente aprova orçamento no portal.',
  },
  fornecedor: {
    title: 'Fornecedor homologado',
    mission: 'Cadastra SKUs solicitados e separa produtos quando a Estlar pede.',
    does: 'Cadastra SKU pedido · separa produto no pedido confirmado',
    doesNot: 'Não orça para cliente nem acessa obras de terceiros.',
  },
  cliente: {
    title: 'Cliente investidor',
    mission: 'Acompanha a obra, aprova orçamentos e vê produtos escolhidos pela Estlar.',
    does: 'Aprova orçamento · acompanha % da obra · lê relatório',
    doesNot: 'Não cadastra fornecedores, produtos nem altera fases.',
  },
}

export function navLabelForRole(baseLabel: string, href: string, role: UserRole): string {
  if (href === '/quotes') {
    return role === 'cliente' ? 'Meus orçamentos' : 'Orçamentos'
  }
  if (href === '/sku-requests') {
    return role === 'fornecedor' ? 'SKUs solicitados' : 'SKUs pedidos'
  }
  if (href === '/products') {
    return role === 'gestor' ? 'Catálogo curado' : 'Meu catálogo'
  }
  if (href === '/projects') {
    return role === 'cliente' ? 'Minha obra' : 'Obras'
  }
  if (href === '/orders') {
    return role === 'fornecedor' ? 'Meus pedidos' : role === 'cliente' ? 'Meus pedidos' : 'Pedidos'
  }
  if (href === '/reports/weekly') {
    return role === 'cliente' ? 'Relatório 360' : 'Relatório 360'
  }
  return baseLabel
}
