import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, requireGestor } from '@/lib/auth/api-context'
import { assertActiveSupplier } from '@/lib/gates'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { notifySupplierUsers } from '@/lib/notify/portal-notify'
import { enrichProjectAndClientNames } from '@/lib/enrich-related-names'
import type { SkuRequest } from '@/types/database'

const createSchema = z.object({
  project_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  name: z.string().min(2),
  category: z.string().min(2).default('Outro'),
  unit: z.string().min(1).default('un'),
  quantity_estimated: z.number().int().min(1).optional().nullable(),
  due_date: z.string().optional().nullable().transform(v => v || null),
  notes: z.string().optional().nullable().transform(v => v || null),
})

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const projectId = req.nextUrl.searchParams.get('project_id')
    const status = req.nextUrl.searchParams.get('status')

    let query = db
      .from('sku_requests')
      .select('*, project:projects(id,name,client_id), supplier:suppliers(id,name), product:products!sku_requests_product_id_fkey(id,name,price,unit,catalog_status,active)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (profile!.role === 'fornecedor') {
      if (!profile!.supplier_id) return ok([])
      query = query.eq('supplier_id', profile!.supplier_id)
    } else if (profile!.role !== 'gestor') {
      return err('Acesso negado', 403)
    }

    if (projectId) query = query.eq('project_id', projectId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return err(error.message, 500)

    const rows = (data ?? []) as SkuRequest[]
    if (profile!.role === 'fornecedor') {
      return ok(await enrichProjectAndClientNames(rows))
    }
    return ok(rows)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const payload = createSchema.parse(await req.json())
    await assertActiveSupplier(payload.supplier_id)

    const db = await createSupabaseServer()
    const { data: project } = await db.from('projects').select('id, name').eq('id', payload.project_id).single()
    if (!project) return err('Obra não encontrada', 404)

    const { data, error } = await db
      .from('sku_requests')
      .insert({
        ...payload,
        status: 'open',
        created_by: profile!.id,
      } as never)
      .select('*, project:projects(id,name), supplier:suppliers(id,name)')
      .single()

    if (error) return err(error.message, 500)

    const row = data as SkuRequest
    await auditAndInvalidate({
      entityType: 'product',
      entityId: row.id,
      eventType: 'sku_request.created',
      title: 'Pedido de SKU criado',
      detail: `${row.name} → ${row.supplier?.name ?? 'fornecedor'}`,
      actorId: profile!.id,
      cachePrefix: 'sku_requests',
    })

    const projectName = (row.project as { name?: string } | undefined)?.name ?? 'obra'
    await notifySupplierUsers(
      row.supplier_id,
      'Novo pedido de SKU da Estlar',
      `${row.name} — ${projectName}`,
      '/sku-requests?status=open',
    )

    return ok(data, undefined, 201)
  } catch (e) {
    if (e instanceof Error && e.message.includes('ativo')) return err(e.message, 422)
    return handleError(e)
  }
}
