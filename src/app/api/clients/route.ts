import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { cacheGet, cacheSet } from '@/lib/cache'
import { parsePagination, paginationMeta } from '@/lib/pagination'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().optional().transform(v => v || null),
  segment: z.string().optional().transform(v => v || null),
  notes: z.string().optional().transform(v => v || null),
})

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')
    const { limit, cursor } = parsePagination(req.nextUrl.searchParams)
    const cacheKey = `clients:${search ?? ''}:${limit}:${cursor ?? ''}`
    const cached = await cacheGet<{ data: unknown[]; meta: Record<string, unknown> }>(cacheKey)
    if (cached) return ok(cached.data, cached.meta)

    const db = createServerClient()

    let query = db.from('clients').select('*').order('created_at', { ascending: false }).limit(limit)
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
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
    const body = await req.json()
    const payload = schema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('clients')
      .insert(payload as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return err('Este email já está cadastrado', 409)
      return err(error.message, 500)
    }
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
