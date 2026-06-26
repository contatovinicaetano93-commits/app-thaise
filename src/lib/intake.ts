export type IntakeScope = 'corporativo' | 'residencial' | 'comercial' | 'desenvolvimento' | 'outro'
export type IntakeIntervention = 'projeto_curadoria' | 'reforma_parcial' | 'construcao_zero' | 'turnkey'
export type IntakeBudget = 'ate_150k' | '150k_500k' | 'acima_500k' | 'acima_1m'
export type IntakeUrgency = 'sem_pressa' | '6_meses' | 'urgente'
export type IntakeStatus = 'pending' | 'approved' | 'review' | 'rejected'

export interface IntakeData {
  scope: IntakeScope
  intervention: IntakeIntervention
  budget: IntakeBudget
  urgency: IntakeUrgency
}

export const INTAKE_SCOPE_OPTIONS: { value: IntakeScope; label: string }[] = [
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'desenvolvimento', label: 'Desenvolvimento Imobiliário' },
  { value: 'outro', label: 'Outro' },
]

export const INTAKE_INTERVENTION_OPTIONS: { value: IntakeIntervention; label: string }[] = [
  { value: 'projeto_curadoria', label: 'Apenas projeto e curadoria' },
  { value: 'reforma_parcial', label: 'Reforma parcial' },
  { value: 'construcao_zero', label: 'Construção do zero' },
  { value: 'turnkey', label: 'Turnkey — entrega completa' },
]

export const INTAKE_BUDGET_OPTIONS: { value: IntakeBudget; label: string }[] = [
  { value: 'ate_150k', label: 'Até R$ 150.000' },
  { value: '150k_500k', label: 'Entre R$ 150.000 e R$ 500.000' },
  { value: 'acima_500k', label: 'Acima de R$ 500.000' },
  { value: 'acima_1m', label: 'Acima de R$ 1 milhão' },
]

export const INTAKE_URGENCY_OPTIONS: { value: IntakeUrgency; label: string }[] = [
  { value: 'sem_pressa', label: 'Sem pressa — quero excelência' },
  { value: '6_meses', label: 'Preciso nos próximos 6 meses' },
  { value: 'urgente', label: 'Urgente — para ontem' },
]

const BUDGET_SCORE: Record<IntakeBudget, number> = {
  ate_150k: 0,
  '150k_500k': 15,
  acima_500k: 25,
  acima_1m: 30,
}

const URGENCY_SCORE: Record<IntakeUrgency, number> = {
  sem_pressa: 20,
  '6_meses': 15,
  urgente: 5,
}

const INTERVENTION_SCORE: Record<IntakeIntervention, number> = {
  projeto_curadoria: 15,
  reforma_parcial: 10,
  construcao_zero: 20,
  turnkey: 25,
}

const SCOPE_SCORE: Record<IntakeScope, number> = {
  corporativo: 20,
  residencial: 15,
  comercial: 15,
  desenvolvimento: 25,
  outro: 5,
}

export function scoreIntake(data: IntakeData): { score: number; status: IntakeStatus; reason: string } {
  let score = SCOPE_SCORE[data.scope] + INTERVENTION_SCORE[data.intervention]
    + BUDGET_SCORE[data.budget] + URGENCY_SCORE[data.urgency]

  if (data.urgency === 'urgente' && data.budget === 'ate_150k') {
    return { score: 10, status: 'rejected', reason: 'Urgência alta com orçamento abaixo do perfil Estlar' }
  }

  if (data.budget === 'ate_150k') {
    return { score: Math.min(score, 35), status: 'rejected', reason: 'Orçamento abaixo do perfil ideal hoje' }
  }

  if (score >= 70) {
    return { score, status: 'approved', reason: 'Perfil alinhado — agendar briefing estratégico' }
  }

  if (score >= 50) {
    return { score, status: 'review', reason: 'Perfil intermediário — revisão manual recomendada' }
  }

  return { score, status: 'rejected', reason: 'Perfil fora do ICP Estlar no momento' }
}

export function intakeStatusLabel(status: IntakeStatus | null | undefined): string {
  if (status === 'approved') return 'Aprovado'
  if (status === 'review') return 'Em revisão'
  if (status === 'rejected') return 'Não qualificado'
  return 'Pendente'
}

export function intakeStatusColor(status: IntakeStatus | null | undefined): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'review') return 'bg-amber-100 text-amber-700'
  if (status === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}
