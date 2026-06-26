/** QCPS — Qualidade, Custo, Prazo, Sustentabilidade (0–10) */

export interface QcpsScores {
  score_q: number
  score_c: number
  score_p: number
  score_s: number
}

export const QCPS_LABELS = {
  score_q: { short: 'Q', label: 'Qualidade' },
  score_c: { short: 'C', label: 'Custo' },
  score_p: { short: 'P', label: 'Prazo' },
  score_s: { short: 'S', label: 'Sustentabilidade' },
} as const

export const QCPS_KEYS = ['score_q', 'score_c', 'score_p', 'score_s'] as const

/** Pesos Estlar: Q 40%, C 25%, P 25%, S 10% */
export const QCPS_WEIGHTS = {
  score_q: 0.4,
  score_c: 0.25,
  score_p: 0.25,
  score_s: 0.1,
} as const

export type HomologationTier = 'A' | 'B' | 'C'

export function qcpsWeightedAverage(s: QcpsScores): number {
  const total =
    s.score_q * QCPS_WEIGHTS.score_q +
    s.score_c * QCPS_WEIGHTS.score_c +
    s.score_p * QCPS_WEIGHTS.score_p +
    s.score_s * QCPS_WEIGHTS.score_s
  return Math.round(total * 10) / 10
}

/** @deprecated use qcpsWeightedAverage — mantido para compatibilidade */
export function qcpsAverage(s: QcpsScores): number {
  return qcpsWeightedAverage(s)
}

export function homologationTierFromQcps(avg: number): HomologationTier {
  if (avg >= 8) return 'A'
  if (avg >= 6) return 'B'
  return 'C'
}

export function homologationTierLabel(tier: HomologationTier): string {
  if (tier === 'A') return 'Nível A — Homologado'
  if (tier === 'B') return 'Nível B — Com supervisão'
  return 'Nível C — Descartado'
}

export function qcpsColor(value: number): string {
  if (value >= 8) return 'bg-emerald-500'
  if (value >= 6) return 'bg-violet-500'
  if (value >= 4) return 'bg-amber-500'
  return 'bg-red-400'
}

export function computeQuotationQcps(scores: QcpsScores): number {
  return qcpsWeightedAverage(scores)
}
