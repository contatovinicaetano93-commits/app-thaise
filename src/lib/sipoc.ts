/**
 * SIPOC — mapeamento do domínio Plataforma Thaise
 *
 * S → Suppliers (Fornecedores curados)
 * I → Inputs (Produtos, dados de projeto, requisitos do cliente)
 * P → Process (Fases A–F, pedidos, QCPS)
 * O → Outputs (Pedidos entregues, scores QCPS, empreendimentos concluídos)
 * C → Customers (Clientes finais)
 */

export const SIPOC = {
  suppliers: {
    role: 'S' as const,
    label: 'Fornecedores',
    entity: 'suppliers',
    desc: 'Fornecedores curados — entradas qualificadas do processo',
  },
  inputs: {
    role: 'I' as const,
    label: 'Entradas',
    entities: ['products', 'projects', 'orders'] as const,
    desc: 'Catálogo, empreendimentos e requisitos do cliente',
  },
  process: {
    role: 'P' as const,
    label: 'Processo',
    entities: ['phases', 'orders', 'qcps'] as const,
    desc: 'Jornada A→F, fluxo de pedidos e avaliação QCPS',
  },
  outputs: {
    role: 'O' as const,
    label: 'Saídas',
    entities: ['orders.delivered', 'projects.completed', 'suppliers.score'] as const,
    desc: 'Entregas, empreendimentos concluídos e scoring retroalimentado',
  },
  customers: {
    role: 'C' as const,
    label: 'Clientes',
    entity: 'clients',
    desc: 'Cliente final — destinatário e validador do valor entregue',
  },
} as const

export type SipocRole = typeof SIPOC[keyof typeof SIPOC]['role']
