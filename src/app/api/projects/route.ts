import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireProfile, filterProjectsByRole } from '@/lib/auth/api-context'
import { assertProjectHasClient } from '@/lib/gates'
import { logActivity } from '@/lib/memory/events'
import { cacheGet, cacheSet } from '@/lib/cache'
import { parsePagination, paginationMeta } from '@/lib/pagination'

const qcpsSchema = z.object({
  score_q: z.coerce.number().min(0).max(10).default(5),
  score_c: z.coerce.number().min(0).max(10).default(5),
  score_p: z.coerce.number().min(0).max(10).default(5),
  score_s: z.coerce.number().min(0).max(10).default(5),
})

const schema = z.object({
  name: z.string().min(2),
  client_id: z.string().uuid('Empreendimento exige cliente vinculado'),
  location: z.string().optional().nullable().transform(v => v || null),
  description: z.string().optional().nullable().transform(v => v || null),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  notes: z.string().optional().nullable().transform(v => v || null),
}).merge(qcpsSchema)

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = createServerClient()
    const search = req.nextUrl.searchParams.get('search')
    const { limit, cursor } = parsePagination(req.nextUrl.searchParams)
    const cacheKey = `projects:${profile!.role}:${search ?? ''}:${limit}:${cursor ?? ''}`
    const cached = await cacheGet<{ data: unknown[]; meta: Record<string, unknown> }>(cacheKey)
    if (cached) return ok(cached.data, cached.meta)

    let query = db
      .from('projects')
      .select('*, client:clients(*)')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (search) query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`)
    if (cursor) query = query.lt('updated_at', cursor)

    const { data, error } = await query
    if (error) return err(error.message, 500)

    const filtered = filterProjectsByRole(data ?? [], profile!.role, profile!)
    const meta = paginationMeta(filtered, limit, 'updated_at')
    await cacheSet(cacheKey, { data: filtered, meta })
    return ok(filtered, meta)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'gestor') return err('Apenas gestor pode criar empreendimentos', 403)

    const body = await req.json()
    const payload = schema.parse(body)
    await assertProjectHasClient(payload.client_id)

    const db = createServerClient()

    const { data, error } = await db
      .from('projects')
      .insert({ ...payload, phase: 'A' } as never)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)

    const project = data as { id: string; name: string }
    await logActivity({
      entityType: 'project',
      entityId: project.id,
      eventType: 'project.created',
      title: 'Empreendimento criado',
      detail: project.name,
      actorId: profile!.id,
    })

    return ok(data, undefined, 201)
  } catch (e) {
    if (e instanceof Error && e.message.includes('SIPOC')) return err(e.message, 422)
    return handleError(e)
  }
}
