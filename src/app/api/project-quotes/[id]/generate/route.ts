import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { QUOTE_SELECT, recalcQuoteTotal } from '@/lib/quotes/server'
import { generateQuoteLines } from '@/lib/agents/quote-agent'
import { auditAndInvalidate } from '@/lib/memory/audit'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id: quoteId } = await params
    const db = await createSupabaseServer()

    const { data: quote } = await db
      .from('project_quotes')
      .select('id, project_id, status, notes')
      .eq('id', quoteId)
      .single() as { data: { id: string; project_id: string; status: string; notes?: string | null } | null }

    if (!quote) return err('Orçamento não encontrado', 404)
    if (quote.status !== 'draft') return err('Só é possível gerar itens em rascunho', 422)

    const generation = await generateQuoteLines(quote.project_id)

    await db.from('project_quote_lines').delete().eq('quote_id', quoteId)

    const inserts = generation.lines.map((line, i) => ({
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

    const notesBlock = [
      generation.summary,
      generation.margin_note,
      generation.ai_powered ? '(Gerado com IA)' : '(Gerado por regras QCPS)',
    ].join('\n\n')

    await db
      .from('project_quotes')
      .update({ notes: notesBlock } as never)
      .eq('id', quoteId)

    const { data, error } = await db.from('project_quotes').select(QUOTE_SELECT).eq('id', quoteId).single()
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'project',
      entityId: quote.project_id,
      eventType: 'quote.ai_generated',
      title: 'Orçamento gerado com IA',
      detail: `${generation.lines.length} itens`,
      actorId: profile!.id,
      cachePrefix: 'project_quotes',
    })

    return ok({ quote: data, generation })
  } catch (e) {
    if (e instanceof Error && (e.message.includes('catálogo') || e.message.includes('Obra'))) {
      return err(e.message, 422)
    }
    return handleError(e)
  }
}
