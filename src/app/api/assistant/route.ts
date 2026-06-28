import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { qcpsAverage } from '@/lib/qcps'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'

export async function POST(req: Request) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { product_id, category } = await req.json() as { product_id?: string; category?: string }
    const db = await createSupabaseServer()

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

    let journeyHint = ''
    if (profile?.role === 'gestor') {
      const [{ count: pendingSuppliers }, { count: intakeReview }, { count: openOrders }] = await Promise.all([
        db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('opportunities').select('id', { count: 'exact', head: true }).in('intake_status', ['pending', 'review']),
        db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'processing']),
      ])
      const hints: string[] = []
      if ((intakeReview ?? 0) > 0) hints.push(`${intakeReview} lead(s) do intake para revisar`)
      if ((pendingSuppliers ?? 0) > 0) hints.push(`${pendingSuppliers} fornecedor(es) aguardando homologação`)
      if ((openOrders ?? 0) > 0) hints.push(`${openOrders} pedido(s) em aberto`)
      journeyHint = hints.join('; ')
    }

    const base = suggestion
      ? `Recomendo ${suggestion.name} (QCPS ${suggestion.score}/10) para esta categoria.`
      : profile?.role === 'gestor'
        ? 'Cadastre fornecedores ativos na categoria desejada.'
        : profile?.role === 'fornecedor'
          ? 'Mantenha seu catálogo atualizado para receber pedidos aprovados.'
          : 'Acompanhe seus empreendimentos e pedidos no menu lateral.'

    let message = journeyHint ? `${base} Prioridade operacional: ${journeyHint}.` : base

    if (isLlmConfigured()) {
      const ai = await chatCompletion([
        {
          role: 'system',
          content: 'Você é o assistente do Hub Estlar. Responda em 2 frases objetivas em português, acionáveis.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            perfil: profile?.role,
            recomendacao_fornecedor: suggestion,
            fornecedores_ranking: ranked,
            contexto_operacional: journeyHint || null,
            mensagem_base: base,
          }),
        },
      ], { maxTokens: 120 })
      if (ai) message = ai
    }

    return ok({ suppliers: ranked, suggestion, message, aiPowered: isLlmConfigured() })
  } catch (e) {
    return handleError(e)
  }
}
