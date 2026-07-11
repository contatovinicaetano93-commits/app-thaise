import { qcpsWeightedAverage, type HomologationTier } from '@/lib/qcps'

export interface SupplierForMatch {
  id: string
  name: string
  category: string
  status: string
  score_q: number
  score_c: number
  score_p: number
  score_s: number
  homologation_tier?: HomologationTier | null
}

export interface RankedSupplier {
  id: string
  name: string
  category: string
  score: number
  tier: HomologationTier
  scores: { score_q: number; score_c: number; score_p: number; score_s: number }
}

export function categoriesMatch(supplierCategory: string, productCategory: string): boolean {
  const s = supplierCategory.toLowerCase()
  const p = productCategory.toLowerCase()
  return s.includes(p) || p.includes(s)
}

export function supplierQcpsScore(s: Pick<SupplierForMatch, 'score_q' | 'score_c' | 'score_p' | 'score_s'>): number {
  return qcpsWeightedAverage(s)
}

export function homologationTierFromScore(score: number): HomologationTier {
  if (score >= 8) return 'A'
  if (score >= 6) return 'B'
  return 'C'
}

/** Ranqueia fornecedores ativos por QCPS, opcionalmente filtrados por categoria do produto. */
export function rankSuppliers(suppliers: SupplierForMatch[], productCategory?: string): RankedSupplier[] {
  return suppliers
    .filter(s => s.status === 'active')
    .filter(s => !productCategory || categoriesMatch(s.category, productCategory))
    .map(s => {
      const score = supplierQcpsScore(s)
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        score,
        tier: (s.homologation_tier ?? homologationTierFromScore(score)) as HomologationTier,
        scores: { score_q: s.score_q, score_c: s.score_c, score_p: s.score_p, score_s: s.score_s },
      }
    })
    .filter(s => s.tier !== 'C')
    .sort((a, b) => b.score - a.score)
}

export interface MatchmakingPick {
  category: string
  supplier_id: string
  supplier_name: string
  qcps_score: number
  tier: string
  alternatives: Array<{ id: string; name: string; score: number }>
}

export interface QuoteLineSuggestion {
  product_id: string
  supplier_id: string
  quantity: number
  unit_price: number
  notes?: string | null
}

export interface QuoteGenerationResult {
  lines: QuoteLineSuggestion[]
  matchmaking: MatchmakingPick[]
  summary: string
  ai_powered: boolean
  margin_note: string
}

export function pickBestSupplierForCategory(
  suppliers: SupplierForMatch[],
  productCategory: string,
): RankedSupplier | null {
  return rankSuppliers(suppliers, productCategory)[0] ?? null
}
