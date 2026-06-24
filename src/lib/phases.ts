export type ProjectPhase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const PHASES: { id: ProjectPhase; label: string; desc: string }[] = [
  { id: 'A', label: 'Concepção', desc: 'Levantamento, viabilidade e programa de necessidades' },
  { id: 'B', label: 'Definição', desc: 'Estudos preliminares, anteprojeto e projeto legal' },
  { id: 'C', label: 'Interfaces', desc: 'Custos, métodos construtivos e prazos' },
  { id: 'D', label: 'Detalhamento', desc: 'Projeto executivo e sistemas' },
  { id: 'E', label: 'Pós-projeto', desc: 'Checklist e saneamento de dúvidas' },
  { id: 'F', label: 'Pós-obra', desc: 'Checkout, as built e scoring final' },
]

export const PHASE_ORDER: ProjectPhase[] = ['A', 'B', 'C', 'D', 'E', 'F']

export function nextPhase(current: ProjectPhase): ProjectPhase | null {
  const i = PHASE_ORDER.indexOf(current)
  return i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : null
}

export function phaseIndex(phase: ProjectPhase): number {
  return PHASE_ORDER.indexOf(phase)
}
