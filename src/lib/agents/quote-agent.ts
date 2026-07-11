/**
 * Orçamentista IA — gera rascunho de orçamento a partir do catálogo aprovado da obra,
 * priorizando fornecedores via matchmaking QCPS.
 */

import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import { createServiceClient } from '@/lib/supabase-server'
import { pickBestSupplierForCategory, rankSuppliers, type SupplierForMatch, type MatchmakingPick, type QuoteLineSuggestion, type QuoteGenerationResult } from '@/lib/quotes/matchmaking'

export type { MatchmakingPick, QuoteLineSuggestion, QuoteGenerationResult }

interface ProductRow {
  id: string
  supplier_id: string
  name: string
  description?: string | null
  category: string
  price: number
  unit: string
  min_order?: number | null
  lead_time_days?: number | null
  supplier?: { id: string; name: string; category: string; status: string; score_q: number; score_c: number; score_p: number; score_s: number; homologation_tier?: string | null } | null
}

const MAX_PRODUCTS_PER_CATEGORY = 2
const MAX_TOTAL_LINES = 20

function heuristicQuantity(product: ProductRow): number {
  return Math.max(1, product.min_order ?? 1)
}

/** Seleciona produtos aprovados priorizando o melhor fornecedor QCPS por categoria. */
function selectProductsByMatchmaking(
  products: ProductRow[],
  suppliers: SupplierForMatch[],
): { selected: ProductRow[]; matchmaking: MatchmakingPick[] } {
  const byCategory = new Map<string, ProductRow[]>()
  for (const p of products) {
    const list = byCategory.get(p.category) ?? []
    list.push(p)
    byCategory.set(p.category, list)
  }

  const matchmaking: MatchmakingPick[] = []
  const selected: ProductRow[] = []

  for (const [category, categoryProducts] of byCategory) {
    const ranked = rankSuppliers(suppliers, category)
    const best = ranked[0]
    if (!best) continue

    matchmaking.push({
      category,
      supplier_id: best.id,
      supplier_name: best.name,
      qcps_score: best.score,
      tier: best.tier,
      alternatives: ranked.slice(1, 3).map(r => ({ id: r.id, name: r.name, score: r.score })),
    })

    const fromBest = categoryProducts.filter(p => p.supplier_id === best.id)
    const pool = fromBest.length > 0 ? fromBest : categoryProducts
    selected.push(...pool.slice(0, MAX_PRODUCTS_PER_CATEGORY))
  }

  return { selected: selected.slice(0, MAX_TOTAL_LINES), matchmaking }
}

function toLineSuggestions(products: ProductRow[]): QuoteLineSuggestion[] {
  return products.map(p => ({
    product_id: p.id,
    supplier_id: p.supplier_id,
    quantity: heuristicQuantity(p),
    unit_price: p.price,
    notes: null,
  }))
}

type LlmLinePick = { product_id: string; quantity: number }

async function refineWithLlm(
  project: { name: string; description?: string | null; notes?: string | null; location?: string | null },
  candidates: ProductRow[],
  matchmaking: MatchmakingPick[],
): Promise<{ lines: QuoteLineSuggestion[]; summary: string } | null> {
  const catalog = candidates.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: p.price,
    supplier: p.supplier?.name,
    min_order: p.min_order ?? 1,
  }))

  const raw = await chatCompletion([
    {
      role: 'system',
      content: `Você é o orçamentista do Hub Estlar. Selecione produtos do catálogo para compor um orçamento prévio da obra.
Responda APENAS com JSON válido no formato: {"lines":[{"product_id":"uuid","quantity":n}],"summary":"2 frases em português"}
Regras: use só product_ids da lista; quantity >= min_order; priorize fornecedores recomendados no matchmaking; máximo ${MAX_TOTAL_LINES} itens.`,
    },
    {
      role: 'user',
      content: JSON.stringify({
        obra: project,
        matchmaking,
        catalogo: catalog,
      }),
    },
  ], { maxTokens: 800, temperature: 0.2 })

  if (!raw) return null

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0]) as { lines?: LlmLinePick[]; summary?: string }
    if (!Array.isArray(parsed.lines) || parsed.lines.length === 0) return null

    const byId = new Map(candidates.map(p => [p.id, p]))
    const lines: QuoteLineSuggestion[] = []

    for (const pick of parsed.lines.slice(0, MAX_TOTAL_LINES)) {
      const product = byId.get(pick.product_id)
      if (!product) continue
      lines.push({
        product_id: product.id,
        supplier_id: product.supplier_id,
        quantity: Math.max(heuristicQuantity(product), Math.round(Number(pick.quantity) || 1)),
        unit_price: product.price,
        notes: null,
      })
    }

    if (lines.length === 0) return null

    return {
      lines,
      summary: parsed.summary?.trim() ?? 'Orçamento prévio gerado com base no catálogo aprovado e matchmaking QCPS.',
    }
  } catch {
    return null
  }
}

export async function generateQuoteLines(projectId: string): Promise<QuoteGenerationResult> {
  const db = createServiceClient()

  const { data: project } = await db
    .from('projects')
    .select('id, name, description, notes, location, phase')
    .eq('id', projectId)
    .single() as {
    data: { id: string; name: string; description?: string | null; notes?: string | null; location?: string | null; phase: string } | null
  }

  if (!project) throw new Error('Obra não encontrada')

  const [{ data: products }, { data: suppliers }] = await Promise.all([
    db
      .from('products')
      .select('id, supplier_id, name, description, category, price, unit, min_order, lead_time_days, supplier:suppliers(id, name, category, status, score_q, score_c, score_p, score_s, homologation_tier)')
      .eq('project_id', projectId)
      .eq('catalog_status', 'approved')
      .eq('active', true),
    db
      .from('suppliers')
      .select('id, name, category, status, score_q, score_c, score_p, score_s, homologation_tier'),
  ])

  const productRows = (products ?? []) as ProductRow[]
  if (productRows.length === 0) {
    throw new Error('Nenhum produto aprovado no catálogo desta obra — aprove SKUs antes de gerar o orçamento')
  }

  const supplierRows = (suppliers ?? []) as SupplierForMatch[]
  const { selected, matchmaking } = selectProductsByMatchmaking(productRows, supplierRows)

  const marginNote = 'Estimativa prévia com margem de 5–10% — revisão do gestor obrigatória antes do envio ao cliente.'

  if (isLlmConfigured()) {
    const refined = await refineWithLlm(project, selected, matchmaking)
    if (refined) {
      return {
        lines: refined.lines,
        matchmaking,
        summary: refined.summary,
        ai_powered: true,
        margin_note: marginNote,
      }
    }
  }

  const bestNames = matchmaking.map(m => `${m.supplier_name} (${m.qcps_score})`).join(', ')
  const summary = productRows.length === selected.length
    ? `Orçamento com ${selected.length} item(ns) do catálogo aprovado. Fornecedores priorizados por QCPS: ${bestNames}.`
    : `Orçamento prévio com ${selected.length} item(ns) selecionados de ${productRows.length} no catálogo. Matchmaking QCPS: ${bestNames}.`

  return {
    lines: toLineSuggestions(selected),
    matchmaking,
    summary,
    ai_powered: false,
    margin_note: marginNote,
  }
}

/** Utilitário para sugerir fornecedor ao adicionar produto manualmente. */
export function suggestSupplierForProduct(
  suppliers: SupplierForMatch[],
  productCategory: string,
  currentSupplierId?: string,
): { best: ReturnType<typeof pickBestSupplierForCategory>; shouldSwitch: boolean } {
  const best = pickBestSupplierForCategory(suppliers, productCategory)
  const shouldSwitch = Boolean(best && currentSupplierId && best.id !== currentSupplierId && best.score >= 7)
  return { best, shouldSwitch }
}
