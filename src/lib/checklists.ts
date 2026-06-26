import type { ProjectPhase } from '@/lib/phases'
import type { ChecklistItemValue, PhaseChecklist } from '@/lib/auth/roles'

export type { ChecklistItemValue }

export interface ChecklistItem {
  id: string
  label: string
}

export const PHASE_CHECKLISTS: Record<ProjectPhase, ChecklistItem[]> = {
  A: [
    { id: 'a1', label: 'Levantamento planialtimétrico e sondagem (5W2H)' },
    { id: 'a2', label: 'Estudo de viabilidade (EV) aprovado' },
    { id: 'a3', label: 'Programa de necessidades (PN) definido' },
    { id: 'a4', label: 'Índices urbanísticos validados (TO, CA, permeabilidade, recuos)' },
    { id: 'a5', label: 'Dossiê Zero legal criado (PDM, zoneamento)' },
  ],
  B: [
    { id: 'b1', label: 'Estudos preliminares (EP) entregues' },
    { id: 'b2', label: 'Anteprojeto (AP) validado' },
    { id: 'b3', label: 'Projeto legal (PL) aprovado' },
    { id: 'b4', label: 'Veto interno estético/técnico antes de apresentar ao cliente' },
  ],
  C: [
    { id: 'c1', label: 'Avaliação de custos concluída' },
    { id: 'c2', label: 'Método construtivo definido' },
    { id: 'c3', label: 'Prazos finais acordados' },
    { id: 'c4', label: 'Cronograma físico-financeiro elaborado' },
  ],
  D: [
    { id: 'd1', label: 'Projeto executivo (PE) elaborado' },
    { id: 'd2', label: 'Sistemas e componentes detalhados' },
    { id: 'd3', label: 'Compatibilização MEP sem conflitos' },
    { id: 'd4', label: 'Veto documental — plantas cotadas e selos no padrão Estlar' },
  ],
  E: [
    { id: 'e1', label: 'Checklist pós-entrega realizado' },
    { id: 'e2', label: 'Dúvidas projetuais sanadas' },
    { id: 'e3', label: 'Documentação revisada pelo cliente' },
    { id: 'e4', label: 'Diário de obra atualizado (previsto vs realizado)' },
  ],
  F: [
    { id: 'f1', label: 'Checkout da obra concluído' },
    { id: 'f2', label: 'As built levantado e manual do proprietário entregue' },
    { id: 'f3', label: 'Scoring QCPS retroalimentado' },
    { id: 'f4', label: 'Sessão fotográfica e styling final realizados' },
  ],
}

export function isChecklistItemDone(value: ChecklistItemValue | undefined): boolean {
  if (value === true) return true
  if (value && typeof value === 'object' && 'checked' in value) return value.checked === true
  return false
}

export function emptyChecklist(): PhaseChecklist {
  return { A: {}, B: {}, C: {}, D: {}, E: {}, F: {} }
}

export function isPhaseComplete(phase: ProjectPhase, checklist: PhaseChecklist): boolean {
  const items = PHASE_CHECKLISTS[phase]
  const done = checklist[phase] ?? {}
  return items.every(item => isChecklistItemDone(done[item.id]))
}

export function phaseProgress(phase: ProjectPhase, checklist: PhaseChecklist): { done: number; total: number } {
  const items = PHASE_CHECKLISTS[phase]
  const done = checklist[phase] ?? {}
  const count = items.filter(item => isChecklistItemDone(done[item.id])).length
  return { done: count, total: items.length }
}
