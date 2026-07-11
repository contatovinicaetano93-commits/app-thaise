import type { ProjectPhase } from '@/lib/phases'

export interface AuditCriteria {
  phase: ProjectPhase
  itemId: string
  label: string
  focus: string[]
}

const EXECUTION_PHASES = new Set<ProjectPhase>(['D', 'E', 'F'])

/** Critérios ESTLAR por item de checklist — guia a auditoria visual. */
export function auditCriteriaFor(phase: ProjectPhase, itemId: string, itemLabel: string): AuditCriteria {
  if (EXECUTION_PHASES.has(phase)) {
    return {
      phase,
      itemId,
      label: itemLabel,
      focus: [
        'Acabamento e limpeza do ambiente (padrão Estlar)',
        'Alinhamento, nivelamento e continuidade de materiais',
        'Ausência de danos, rebarbas, manchas ou improvisos visíveis',
        'Consistência com especificação curada (pisos, revestimentos, marcenaria)',
        'Organização do canteiro / área entregue',
      ],
    }
  }

  if (phase === 'C') {
    return {
      phase,
      itemId,
      label: itemLabel,
      focus: [
        'Documentação legível e completa',
        'Coerência entre escopo visual e memorial descritivo',
        'Indicação clara de materiais homologados',
      ],
    }
  }

  return {
    phase,
    itemId,
    label: itemLabel,
    focus: [
      'Clareza documental e legibilidade',
      'Coerência com método QCPS e padrão Estlar',
      'Evidência suficiente para o item do checklist',
    ],
  }
}

export const AUDIT_PASS_THRESHOLD = 7

export function auditStatusFromScore(score: number): 'passed' | 'failed' {
  return score >= AUDIT_PASS_THRESHOLD ? 'passed' : 'failed'
}
