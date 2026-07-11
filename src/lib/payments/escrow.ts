import type { EvidenceAudit, PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'
import { PHASE_CHECKLISTS } from '@/lib/checklists'

export type PaymentReleaseAudit = {
  phase: ProjectPhase
  itemId: string
  itemLabel: string
  audit: EvidenceAudit
}

const EXECUTION_PHASES: ProjectPhase[] = ['F', 'E', 'D']

export function isAuditEligibleForRelease(audit?: EvidenceAudit | null): boolean {
  return audit?.status === 'passed' || audit?.status === 'override'
}

/** Localiza a melhor evidência auditada elegível para liberar pagamento. */
export function findEligibleReleaseAudit(
  checklist: PhaseChecklist | null | undefined,
  preferred?: { phase: ProjectPhase; itemId: string },
): PaymentReleaseAudit | null {
  if (preferred) {
    const raw = checklist?.[preferred.phase]?.[preferred.itemId]
    if (raw && typeof raw === 'object' && 'audit' in raw && raw.audit && isAuditEligibleForRelease(raw.audit)) {
      const label = PHASE_CHECKLISTS[preferred.phase].find(i => i.id === preferred.itemId)?.label ?? preferred.itemId
      return { phase: preferred.phase, itemId: preferred.itemId, itemLabel: label, audit: raw.audit }
    }
    return null
  }

  let best: PaymentReleaseAudit | null = null

  for (const phase of EXECUTION_PHASES) {
    const phaseItems = checklist?.[phase] ?? {}
    for (const [itemId, value] of Object.entries(phaseItems)) {
      if (!value || typeof value !== 'object' || !('audit' in value) || !value.audit) continue
      if (!value.filePath) continue
      if (!isAuditEligibleForRelease(value.audit)) continue

      const candidate: PaymentReleaseAudit = {
        phase,
        itemId,
        itemLabel: PHASE_CHECKLISTS[phase].find(i => i.id === itemId)?.label ?? itemId,
        audit: value.audit,
      }

      if (!best || value.audit.audited_at > best.audit.audited_at) {
        best = candidate
      }
    }
  }

  return best
}

export function releaseBlockReason(
  checklist: PhaseChecklist | null | undefined,
  preferred?: { phase: ProjectPhase; itemId: string },
): string {
  if (preferred) {
    const raw = checklist?.[preferred.phase]?.[preferred.itemId]
    const audit = raw && typeof raw === 'object' && 'audit' in raw ? raw.audit : undefined
    if (!audit) {
      return 'Execute a auditoria visual no item de checklist vinculado antes de liberar o pagamento.'
    }
    if (audit.status === 'pending') {
      return 'Auditoria pendente — aprove ou reprove a evidência no checklist da obra.'
    }
    if (audit.status === 'failed') {
      return 'Auditoria reprovada — corrija a evidência ou use sobrescrever no checklist antes de liberar.'
    }
    return 'Evidência não elegível para liberação.'
  }

  const eligible = findEligibleReleaseAudit(checklist)
  if (!eligible) {
    return 'Nenhuma evidência aprovada nas fases D/E/F. Anexe foto, audite e aprove no checklist da obra.'
  }
  return ''
}
