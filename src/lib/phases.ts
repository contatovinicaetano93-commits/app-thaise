export type ProjectPhase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const PHASES: { id: ProjectPhase; label: string; desc: string }[] = [
  { id: 'A', label: 'Concepção', desc: 'Levantamento, viabilidade e programa de necessidades' },
  { id: 'B', label: 'Definição', desc: 'Estudos preliminares, anteprojeto e projeto legal' },
  { id: 'C', label: 'Interfaces', desc: 'Custos, métodos construtivos e prazos' },
  { id: 'D', label: 'Detalhamento', desc: 'Projeto executivo e sistemas' },
  { id: 'E', label: 'Pós-projeto', desc: 'Checklist e saneamento de dúvidas' },
  { id: 'F', label: 'Pós-obra', desc: 'Checkout, as built e scoring final' },
]

/** Labels Estlar — o que o cliente vê na jornada */
export const CLIENT_PHASE_LABELS: Record<ProjectPhase, { label: string; desc: string }> = {
  A: { label: 'Imersão & Estratégia', desc: 'Briefing, viabilidade e programa de necessidades' },
  B: { label: 'Curadoria & Conceito', desc: 'Identidade visual, materiais e soluções de design' },
  C: { label: 'Planejamento', desc: 'Custos, métodos construtivos e cronograma' },
  D: { label: 'Detalhamento Executivo', desc: 'Guias técnicos para execução precisa' },
  E: { label: 'Gestão & Materialização', desc: 'Acompanhamento técnico e fornecedores homologados' },
  F: { label: 'Handover & Pós-obra', desc: 'Entrega cerimonial, as built e QCPS final' },
}

export const PHASE_ORDER: ProjectPhase[] = ['A', 'B', 'C', 'D', 'E', 'F']

export function nextPhase(current: ProjectPhase): ProjectPhase | null {
  const i = PHASE_ORDER.indexOf(current)
  return i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : null
}

export function phaseIndex(phase: ProjectPhase): number {
  return PHASE_ORDER.indexOf(phase)
}
