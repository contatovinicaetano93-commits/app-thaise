import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, requireGestor, filterSuppliersByRole } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { cacheGet, cacheSet } from '@/lib/cache'
import { parsePagination, paginationMeta } from '@/lib/pagination'
import { notifySupplierHomologated } from '@/lib/notify/supplier-homologated'

const qcpsSchema = z.object({
  score_q: z.coerce.number().min(0).max(10).default(5),
  score_c: z.coerce.number().min(0).max(10).default(5),
  score_p: z.coerce.number().min(0).max(10).default(5),
  score_s: z.coerce.number().min(0).max(10).default(5),
})

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  contact_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().min(8),
  website: z.string().url().optional().or(z.literal('')).transform(v => v || null),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
  notes: z.string().optional().transform(v => v || null),
}).merge(qcpsSchema)

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const search = req.nextUrl.searchParams.get('search')
    const { limit, cursor } = parsePagination(req.nextUrl.searchParams)
    const cacheKey = `suppliers:${profile!.role}:${search ?? ''}:${limit}:${cursor ?? ''}`
    const cached = await cacheGet<{ data: unknown[]; meta: Record<string, unknown> }>(cacheKey)
    if (cached) return ok(cached.data, cached.meta)

    const db = await createSupabaseServer()

    let query = db.from('suppliers').select('*').order('created_at', { ascending: false }).limit(limit)
    if (search) query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`)
    if (cursor) query = query.lt('created_at', cursor)
    if (profile!.role === 'fornecedor' && profile!.supplier_id) {
      query = query.eq('id', profile!.supplier_id)
    }

    const { data, error } = await query
    if (error) return err(error.message, 500)

    const filtered = filterSuppliersByRole(data ?? [], profile!.role, profile!)
    const meta = paginationMeta(filtered, limit, 'created_at')
    await cacheSet(cacheKey, { data: filtered, meta })
    return ok(filtered, meta)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const body = await req.json()
    const parsed = schema.parse(body)
    const db = await createSupabaseServer()

    const { data, error } = await db
      .from('suppliers')
      .insert(parsed as never)
      .select()
      .single()

    if (error) return err(error.message, 500)

    const supplier = data as {
      id: string
      name: string
      status: string
      contact_email: string
      contact_name: string
    }

    await auditAndInvalidate({
      entityType: 'supplier',
      entityId: supplier.id,
      eventType: supplier.status === 'active' ? 'supplier.approved' : 'supplier.created',
      title: supplier.status === 'active' ? 'Fornecedor homologado' : 'Fornecedor cadastrado',
      detail: supplier.name,
      actorId: profile!.id,
      cachePrefix: 'suppliers',
    })

    let email: Awaited<ReturnType<typeof notifySupplierHomologated>> | undefined
    if (supplier.status === 'active' && supplier.contact_email) {
      email = await notifySupplierHomologated({
        contactEmail: supplier.contact_email,
        contactName: supplier.contact_name,
        supplierName: supplier.name,
      })
    }

    return ok({ ...supplier, email }, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
