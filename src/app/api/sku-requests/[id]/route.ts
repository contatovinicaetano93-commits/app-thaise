import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'

type Action = 'approve' | 'reject' | 'cancel'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const { action } = (await req.json()) as { action: Action }
    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return err('Ação inválida', 422)
    }

    const db = await createSupabaseServer()
    const { data: request } = await db
      .from('sku_requests')
      .select('*, product:products!sku_requests_product_id_fkey(id, name, catalog_status)')
      .eq('id', id)
      .single()

    if (!request) return err('Pedido de SKU não encontrado', 404)

    const row = request as {
      id: string
      name: string
      status: string
      product_id: string | null
      product?: { id: string; name: string } | null
    }

    if (action === 'cancel') {
      if (!['open', 'submitted'].includes(row.status)) {
        return err('Só é possível cancelar pedidos abertos ou enviados', 422)
      }
      const { data, error } = await db
        .from('sku_requests')
        .update({ status: 'cancelled' } as never)
        .eq('id', id)
        .select('*, project:projects(id,name), supplier:suppliers(id,name), product:products!sku_requests_product_id_fkey(id,name,price,unit,catalog_status,active)')
        .single()
      if (error) return err(error.message, 500)
      return ok(data)
    }

    if (action === 'approve') {
      if (row.status !== 'submitted' || !row.product_id) {
        return err('Aprove apenas SKUs já cadastrados pelo fornecedor', 422)
      }
      await db.from('products').update({ catalog_status: 'approved', active: true } as never).eq('id', row.product_id)
      const { data, error } = await db
        .from('sku_requests')
        .update({ status: 'approved' } as never)
        .eq('id', id)
        .select('*, project:projects(id,name), supplier:suppliers(id,name), product:products!sku_requests_product_id_fkey(id,name,price,unit,catalog_status,active)')
        .single()
      if (error) return err(error.message, 500)

      await auditAndInvalidate({
        entityType: 'product',
        entityId: row.product_id,
        eventType: 'sku_request.approved',
        title: 'SKU aprovado no catálogo',
        detail: row.product?.name ?? row.name,
        actorId: profile!.id,
        cachePrefix: 'products',
      })
      return ok(data)
    }

    // reject
    if (row.status !== 'submitted' || !row.product_id) {
      return err('Rejeite apenas SKUs enviados pelo fornecedor', 422)
    }
    await db.from('products').update({ catalog_status: 'rejected', active: false } as never).eq('id', row.product_id)
    const { data, error } = await db
      .from('sku_requests')
      .update({ status: 'rejected' } as never)
      .eq('id', id)
      .select('*, project:projects(id,name), supplier:suppliers(id,name), product:products!sku_requests_product_id_fkey(id,name,price,unit,catalog_status,active)')
      .single()
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'product',
      entityId: row.product_id,
      eventType: 'sku_request.rejected',
      title: 'SKU rejeitado',
      detail: row.product?.name ?? row.name,
      actorId: profile!.id,
      cachePrefix: 'products',
    })
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
