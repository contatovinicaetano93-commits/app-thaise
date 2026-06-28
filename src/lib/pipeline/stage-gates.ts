import type { OpportunityStage } from '@/lib/pipeline'
import { ACTIVE_PIPELINE_STAGES } from '@/lib/pipeline'
import type { Opportunity } from '@/types/database'

const STAGE_INDEX = Object.fromEntries(
  ACTIVE_PIPELINE_STAGES.map((s, i) => [s, i]),
) as Record<OpportunityStage, number>

/** Valida transição de estágio no pipeline comercial. */
export function validateStageTransition(
  opp: Pick<Opportunity, 'stage' | 'briefing_data' | 'briefing_type' | 'fee_model'>,
  to: OpportunityStage,
): string | null {
  if (to === 'perdido') return null
  if (opp.stage === 'ganho' || opp.stage === 'perdido') {
    return 'Oportunidade já encerrada'
  }

  const fromIdx = STAGE_INDEX[opp.stage as OpportunityStage]
  const toIdx = STAGE_INDEX[to as OpportunityStage]
  if (fromIdx === undefined || toIdx === undefined) return null

  if (toIdx > fromIdx + 1) {
    return `Avance uma etapa por vez (${opp.stage} → próximo estágio)`
  }

  if (toIdx >= STAGE_INDEX.viabilidade_previa) {
    const hasBriefing = Boolean(opp.briefing_type || (opp.briefing_data && Object.keys(opp.briefing_data).length > 0))
    if (!hasBriefing) {
      return 'Complete o briefing antes de avançar'
    }
  }

  if (to === 'contrato' && !opp.fee_model) {
    return 'Defina o modelo de cobrança (fee) antes do contrato'
  }

  return null
}
