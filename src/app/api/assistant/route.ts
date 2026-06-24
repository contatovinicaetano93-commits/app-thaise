import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createServerClient } from '@/lib/supabase-server'
import { qcpsAverage } from '@/lib/qcps'

export async function POST(req: Request) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { product_id, category } = await req.json() as { product_id?: string; category?: string }
    const db = createServerClient()

    let productCategory = category
    if (product_id) {
      const { data: product } = await db.from('products').select('category, supplier_id').eq('id', product_id).single() as {
        data: { category: string; supplier_id: string } | null
      }
      productCategory = product?.category
    }

    const { data: suppliers } = await db
      .from('suppliers')
      .select('id, name, category, status, score_q, score_c, score_p, score_s')
      .eq('status', 'active')

    type SupplierRow = { id: string; name: string; category: string; score_q: number; score_c: number; score_p: number; score_s: number }
    const ranked = ((suppliers ?? []) as SupplierRow[])
      .filter(s => !productCategory || s.category.toLowerCase().includes(productCategory.toLowerCase()) || productCategory.toLowerCase().includes(s.category.toLowerCase()))
      .map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        score: qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    const suggestion = ranked[0]
    const message = suggestion
      ? `Recomendo ${suggestion.name} (QCPS ${suggestion.score}/10) para esta categoria.`
      : profile?.role === 'gestor'
        ? 'Cadastre fornecedores ativos na categoria desejada.'
        : 'Nenhum fornecedor ativo disponível.'

    return ok({ suppliers: ranked, suggestion, message })
  } catch (e) {
    return handleError(e)
  }
}
