export type OpportunityStage =
  | 'primeiro_contato'
  | 'briefing'
  | 'viabilidade_previa'
  | 'proposta'
  | 'contrato'
  | 'ganho'
  | 'perdido'

export type OpportunitySource =
  | 'whatsapp'
  | 'indicacao'
  | 'instagram'
  | 'parceiro'
  | 'evento'
  | 'outro'

export const PIPELINE_STAGES: { id: OpportunityStage; label: string; desc: string }[] = [
  { id: 'primeiro_contato', label: 'Primeiro Contato', desc: 'WhatsApp, indicação ou troca inicial' },
  { id: 'briefing', label: 'Briefing & Persona', desc: 'Reunião presencial ou call — perfil e gosto do investidor' },
  { id: 'viabilidade_previa', label: 'Viabilidade Prévia', desc: 'Estimativa Thaise antes da proposta formal' },
  { id: 'proposta', label: 'Proposta — Obra Fechada', desc: 'Documento entregue ao investidor' },
  { id: 'contrato', label: 'Contrato & Fechamento', desc: 'Advogado, ajustes e assinatura' },
]

export const TERMINAL_STAGES: OpportunityStage[] = ['ganho', 'perdido']

export const ACTIVE_PIPELINE_STAGES = PIPELINE_STAGES.map(s => s.id)

export const OPPORTUNITY_SOURCES: { value: OpportunitySource; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
]

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  primeiro_contato: 'Primeiro Contato',
  briefing: 'Briefing & Persona',
  viabilidade_previa: 'Viabilidade Prévia',
  proposta: 'Proposta — Obra Fechada',
  contrato: 'Contrato & Fechamento',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

export const SOURCE_LABELS: Record<OpportunitySource, string> = Object.fromEntries(
  OPPORTUNITY_SOURCES.map(s => [s.value, s.label]),
) as Record<OpportunitySource, string>

export function isActiveStage(stage: OpportunityStage): boolean {
  return !TERMINAL_STAGES.includes(stage)
}

export function formatBudget(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
