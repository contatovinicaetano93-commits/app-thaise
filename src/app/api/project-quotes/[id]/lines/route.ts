import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { QUOTE_SELECT, recalcQuoteTotal } from '@/lib/quotes/server'
import { createServiceClient } from '@/lib/supabase-server'

const lineSchema = z.object({
  product_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0.01),
  notes: z.string().optional().nullable(),
})

const bodySchema = z.object({
  lines: z.array(lineSchema).min(1),
})

async function assertApprovedProductForProject(productId: string, projectId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('products')
    .select('id, project_id, catalog_status, active, supplier_id')
    .eq('id', productId)
    .single() as {
    data: { id: string; project_id: string | null; catalog_status: string; active: boolean; supplier_id: string } | null
  }
  if (!data) throw new Error('Produto não encontrado')
  if (data.project_id !== projectId) throw new Error('Produto não pertence a esta obra')
  if (data.catalog_status !== 'approved' || !data.active) {
    throw new Error('Use apenas produtos aprovados no catálogo da obra')
  }
  return data
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id: quoteId } = await params
    const { lines } = bodySchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: quote } = await db
      .from('project_quotes')
      .select('id, project_id, status')
      .eq('id', quoteId)
      .single() as { data: { id: string; project_id: string; status: string } | null }

    if (!quote) return err('Orçamento não encontrado', 404)
    if (quote.status !== 'draft') return err('Só é possível editar linhas em rascunho', 422)

    for (const line of lines) {
      const product = await assertApprovedProductForProject(line.product_id, quote.project_id)
      if (product.supplier_id !== line.supplier_id) {
        return err('Fornecedor não corresponde ao produto', 422)
      }
    }

    await db.from('project_quote_lines').delete().eq('quote_id', quoteId)

    const inserts = lines.map((line, i) => ({
      quote_id: quoteId,
      product_id: line.product_id,
      supplier_id: line.supplier_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      notes: line.notes ?? null,
      sort_order: i,
    }))

    const { error: insErr } = await db.from('project_quote_lines').insert(inserts as never)
    if (insErr) return err(insErr.message, 500)

    await recalcQuoteTotal(quoteId)

    const { data, error } = await db.from('project_quotes').select(QUOTE_SELECT).eq('id', quoteId).single()
    if (error) return err(error.message, 500)

    return ok(data)
  } catch (e) {
    if (e instanceof Error && (e.message.includes('Produto') || e.message.includes('catálogo'))) {
      return err(e.message, 422)
    }
    return handleError(e)
  }
}
