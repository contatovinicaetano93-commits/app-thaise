import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { assertActiveSupplier, assertProductForSupplier } from '@/lib/gates'
import { logActivity, logOrderStatus } from '@/lib/memory/events'
import { auditAndInvalidate } from '@/lib/memory/audit'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const db = await createSupabaseServer()

    const { data: quote } = await db
      .from('project_quotes')
      .select(`
        id, project_id, client_id, status, title,
        lines:project_quote_lines(product_id, supplier_id, quantity, unit_price, notes)
      `)
      .eq('id', id)
      .single()

    if (!quote) return err('Orçamento não encontrado', 404)

    const row = quote as {
      id: string
      project_id: string
      client_id: string
      status: string
      title: string
      lines: Array<{ product_id: string; supplier_id: string; quantity: number; unit_price: number; notes: string | null }>
    }

    if (row.status !== 'approved') {
      return err('Só orçamentos aprovados pelo cliente podem gerar pedidos', 422)
    }
    if (!row.lines?.length) return err('Orçamento sem itens', 422)

    const created: string[] = []

    for (const line of row.lines) {
      await assertActiveSupplier(line.supplier_id)
      await assertProductForSupplier(line.product_id, line.supplier_id)

      const { data: order, error } = await db
        .from('orders')
        .insert({
          project_id: row.project_id,
          client_id: row.client_id,
          supplier_id: line.supplier_id,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          notes: line.notes,
          status: 'pending',
        } as never)
        .select('id')
        .single()

      if (error) return err(error.message, 500)
      const orderId = (order as { id: string }).id
      created.push(orderId)

      await logOrderStatus({ orderId, fromStatus: null, toStatus: 'pending', changedBy: profile!.id })
      await logActivity({
        entityType: 'order',
        entityId: orderId,
        eventType: 'order.created_from_quote',
        title: 'Pedido gerado do orçamento',
        detail: row.title,
        actorId: profile!.id,
      })
    }

    await auditAndInvalidate({
      entityType: 'project',
      entityId: row.project_id,
      eventType: 'quote.fulfilled',
      title: 'Pedidos gerados do orçamento',
      detail: `${created.length} pedido(s)`,
      actorId: profile!.id,
      cachePrefix: 'orders',
    })

    return ok({ order_ids: created, count: created.length })
  } catch (e) {
    if (e instanceof Error && (e.message.includes('ativo') || e.message.includes('aprov'))) {
      return err(e.message, 422)
    }
    return handleError(e)
  }
}
