import type { ProjectPhase } from '@/lib/phases'
import type { PhaseChecklist } from '@/lib/auth/roles'

export interface ChecklistItem {
  id: string
  label: string
}

export const PHASE_CHECKLISTS: Record<ProjectPhase, ChecklistItem[]> = {
  A: [
    { id: 'a1', label: 'Levantamento de dados (LV) concluído' },
    { id: 'a2', label: 'Estudo de viabilidade (EV) aprovado' },
    { id: 'a3', label: 'Programa de necessidades (PN) definido' },
  ],
  B: [
    { id: 'b1', label: 'Estudos preliminares (EP) entregues' },
    { id: 'b2', label: 'Anteprojeto (AP) validado' },
    { id: 'b3', label: 'Projeto legal (PL) aprovado' },
  ],
  C: [
    { id: 'c1', label: 'Avaliação de custos concluída' },
    { id: 'c2', label: 'Método construtivo definido' },
    { id: 'c3', label: 'Prazos finais acordados' },
  ],
  D: [
    { id: 'd1', label: 'Projeto executivo (PE) elaborado' },
    { id: 'd2', label: 'Sistemas e componentes detalhados' },
    { id: 'd3', label: 'Interfaces entre especialidades resolvidas' },
  ],
  E: [
    { id: 'e1', label: 'Checklist pós-entrega realizado' },
    { id: 'e2', label: 'Dúvidas projetuais sanadas' },
    { id: 'e3', label: 'Documentação revisada pelo cliente' },
  ],
  F: [
    { id: 'f1', label: 'Checkout da obra concluído' },
    { id: 'f2', label: 'As built levantado e arquivado' },
    { id: 'f3', label: 'Scoring QCPS retroalimentado' },
  ],
}

export function emptyChecklist(): PhaseChecklist {
  return { A: {}, B: {}, C: {}, D: {}, E: {}, F: {} }
}

export function isPhaseComplete(phase: ProjectPhase, checklist: PhaseChecklist): boolean {
  const items = PHASE_CHECKLISTS[phase]
  const done = checklist[phase] ?? {}
  return items.every(item => done[item.id] === true)
}

export function phaseProgress(phase: ProjectPhase, checklist: PhaseChecklist): { done: number; total: number } {
  const items = PHASE_CHECKLISTS[phase]
  const done = checklist[phase] ?? {}
  const count = items.filter(item => done[item.id] === true).length
  return { done: count, total: items.length }
}
