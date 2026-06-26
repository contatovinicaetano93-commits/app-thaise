export interface ProposalData {
  clientName: string
  projectName: string
  areaSqm?: number
  feeFixed?: number
  feeVariablePct?: number
  feeModel?: string
  totalInvestment?: number
  estimatedDays?: number
}

export function generateProposalContent(data: ProposalData): string {
  const feeDesc = data.feeModel === 'hibrido'
    ? `Fee fixo R$ ${(data.feeFixed ?? 0).toLocaleString('pt-BR')} + ${data.feeVariablePct ?? 0}% sobre VGV`
    : data.feeModel === 'variavel'
      ? `${data.feeVariablePct ?? 0}% sobre o sucesso do empreendimento`
      : `Fee de curadoria: R$ ${(data.feeFixed ?? 0).toLocaleString('pt-BR')}`

  return [
    'PROPOSTA COMERCIAL EXECUTIVA — ESTLAR',
    '═'.repeat(50),
    '',
    `Projeto: ${data.projectName}`,
    `Cliente: ${data.clientName}`,
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    '1. COMODIDADE NA ARQUITETURA',
    'A Estlar atua como Hub de Inteligência e Gestão, orquestrando fornecedores homologados',
    'com rigor criativo, técnico e controle de custos e prazos.',
    '',
    '2. INVESTIMENTO E ESCOPO',
    data.areaSqm ? `Área: ${data.areaSqm} m²` : '',
    feeDesc,
    data.totalInvestment
      ? `Investimento estimado: R$ ${data.totalInvestment.toLocaleString('pt-BR')}`
      : '',
    '',
    '2.1 Direção Criativa e Projetos',
    '• Projeto arquitetônico e interiores (LV, EP, AP, Caderno Executivo)',
    '• Compatibilização MEP',
    '• Curadoria de acabamentos padrão Estlar',
    '',
    '2.2 Gestão de Obra e Orquestração',
    '• Homologação de empreiteiros via matriz QCPS',
    '• Cronograma físico de execução',
    '• Auditoria de qualidade e relatórios semanais 360',
    '',
    '3. GOVERNANÇA',
    '• Centro único de decisão — Estlar como hub',
    '• Autonomia curatorial (Veto Estlar)',
    '• Aditamentos apenas via Termo Aditivo formal',
    '',
    data.estimatedDays ? `Prazo estimado: ${data.estimatedDays} dias corridos` : '',
    '',
    'Validade: 7 dias úteis',
    'Thaise Resende | Diretora Criativa e Executiva, Estlar',
  ].filter(Boolean).join('\n')
}

export function generateAmendmentContent(params: {
  projectName: string
  clientName: string
  number: number
  description: string
  amount: number
  daysAdded: number
}): string {
  return [
    `TERMO ADITIVO Nº ${String(params.number).padStart(2, '0')} — ESTLAR`,
    '═'.repeat(50),
    '',
    `Projeto: ${params.projectName}`,
    `Cliente: ${params.clientName}`,
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    '1. ESCOPO DA ALTERAÇÃO',
    params.description,
    '',
    '2. IMPACTO FINANCEIRO',
    `Investimento adicional: R$ ${params.amount.toLocaleString('pt-BR')}`,
    '',
    '3. IMPACTO NO CRONOGRAMA',
    `Acréscimo estimado: ${params.daysAdded} dias úteis`,
    '',
    'Execução iniciada após assinatura e confirmação financeira.',
    '',
    'Thaise Resende | Estlar',
  ].join('\n')
}
