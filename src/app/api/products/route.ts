import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/api-context'
import { assertActiveSupplier } from '@/lib/gates'
import { assertOpenSkuRequestForSupplier } from '@/lib/gates/sku-request'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { cacheGet, cacheSet } from '@/lib/cache'
import { parsePagination, paginationMeta } from '@/lib/pagination'

const schema = z.object({
  supplier_id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().transform(v => v || null),
  category: z.string().min(2),
  price: z.number().min(0.01),
  unit: z.string().min(1).default('un'),
  min_order: z.number().int().min(1).optional(),
  lead_time_days: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  sku_request_id: z.string().uuid().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    if (profile!.role === 'fornecedor' && !profile!.supplier_id) {
      return ok([])
    }

    const db = await createSupabaseServer()
    const supplierId = req.nextUrl.searchParams.get('supplier_id')
      ?? (profile!.role === 'fornecedor' ? profile!.supplier_id : null)
    const projectId = req.nextUrl.searchParams.get('project_id')
    const { limit, cursor } = parsePagination(req.nextUrl.searchParams)
    const cacheKey = `products:${profile!.role}:${supplierId ?? 'all'}:${projectId ?? ''}:${limit}:${cursor ?? ''}`
    const cached = await cacheGet<{ data: unknown[]; meta: Record<string, unknown> }>(cacheKey)
    if (cached) return ok(cached.data, cached.meta)

    let query = db
      .from('products')
      .select('*, supplier:suppliers(id,name), project:projects(id,name)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (supplierId) query = query.eq('supplier_id', supplierId)
    if (projectId) query = query.eq('project_id', projectId)
    if (profile!.role === 'gestor' && req.nextUrl.searchParams.get('pending') === '1') {
      query = query.eq('catalog_status', 'pending')
    }
    if (cursor) query = query.lt('created_at', cursor)

    const { data, error } = await query
    if (error) return err(error.message, 500)

    const meta = paginationMeta(data ?? [], limit, 'created_at')
    await cacheSet(cacheKey, { data, meta })
    return ok(data, meta)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const body = await req.json()
    const payload = schema.parse(body)
    const db = await createSupabaseServer()

    if (profile!.role === 'cliente') return err('Cliente não pode cadastrar produtos', 403)
    if (profile!.role === 'gestor') {
      return err('A Estlar não cadastra produtos — peça ao fornecedor via SKUs pedidos', 403)
    }

    if (profile!.role === 'fornecedor') {
      if (!profile!.supplier_id) return err('Fornecedor não vinculado', 403)
      if (!payload.sku_request_id) {
        return err('Cadastre produtos apenas a partir de um pedido de SKU', 422)
      }
      const sku = await assertOpenSkuRequestForSupplier(payload.sku_request_id, profile!.supplier_id)
      await assertActiveSupplier(profile!.supplier_id)

      const productFields = {
        supplier_id: profile!.supplier_id,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        price: payload.price,
        unit: payload.unit,
        min_order: payload.min_order,
        lead_time_days: payload.lead_time_days,
        sku_request_id: payload.sku_request_id,
        project_id: sku.project_id,
        catalog_status: 'pending' as const,
        active: false,
      }

      let data: unknown
      if (sku.status === 'rejected' && sku.product_id) {
        const updated = await db
          .from('products')
          .update(productFields as never)
          .eq('id', sku.product_id)
          .select('*, supplier:suppliers(id,name), project:projects(id,name)')
          .single()
        if (updated.error) return err(updated.error.message, 500)
        data = updated.data
      } else {
        const inserted = await db
          .from('products')
          .insert(productFields as never)
          .select('*, supplier:suppliers(id,name), project:projects(id,name)')
          .single()
        if (inserted.error) return err(inserted.error.message, 500)
        data = inserted.data
      }

      const product = data as { id: string; name: string }
      await db
        .from('sku_requests')
        .update({ status: 'submitted', product_id: product.id } as never)
        .eq('id', payload.sku_request_id)

      await auditAndInvalidate({
        entityType: 'product',
        entityId: product.id,
        eventType: 'product.created',
        title: 'SKU cadastrado pelo fornecedor',
        detail: product.name,
        actorId: profile!.id,
        cachePrefix: 'products',
      })
      return ok(data, undefined, 201)
    }

    return err('Acesso negado', 403)
  } catch (e) {
    if (e instanceof Error && (e.message.includes('ativo') || e.message.includes('SKU'))) {
      return err(e.message, 422)
    }
    return handleError(e)
  }
}
