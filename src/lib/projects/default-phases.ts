/** Fases padrão ao criar uma obra — Thaise pode editar depois. */
export const DEFAULT_PROJECT_PHASES = [
  { name: 'Projeto', weight_pct: 10 },
  { name: 'Obra cinza', weight_pct: 30 },
  { name: 'Instalações', weight_pct: 25 },
  { name: 'Acabamento', weight_pct: 25 },
  { name: 'Entrega', weight_pct: 10 },
] as const

export function validatePhaseWeights(weights: number[]): string | null {
  if (weights.length === 0) return 'Adicione pelo menos uma fase'
  const sum = weights.reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 100) > 0.01) return `Pesos das fases devem somar 100% (atual: ${sum.toFixed(1)}%)`
  return null
}
