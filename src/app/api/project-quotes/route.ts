import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, requireGestor } from '@/lib/auth/api-context'
import { QUOTE_SELECT, nextQuoteVersion } from '@/lib/quotes/server'
import { auditAndInvalidate } from '@/lib/memory/audit'

const createSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(2).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const projectId = req.nextUrl.searchParams.get('project_id')
    const status = req.nextUrl.searchParams.get('status')

    let query = db
      .from('project_quotes')
      .select(QUOTE_SELECT)
      .order('created_at', { ascending: false })
      .limit(50)

    if (profile!.role === 'cliente') {
      if (!profile!.client_id) return ok([])
      query = query.eq('client_id', profile!.client_id)
    } else if (profile!.role !== 'gestor') {
      return err('Acesso negado', 403)
    }

    if (projectId) query = query.eq('project_id', projectId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const payload = createSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: project } = await db
      .from('projects')
      .select('id, name, client_id')
      .eq('id', payload.project_id)
      .single() as { data: { id: string; name: string; client_id: string | null } | null }

    if (!project?.client_id) return err('Obra precisa de cliente vinculado', 422)

    const version = await nextQuoteVersion(payload.project_id)

    const { data, error } = await db
      .from('project_quotes')
      .insert({
        project_id: payload.project_id,
        client_id: project.client_id,
        version,
        title: payload.title ?? `Orçamento v${version} — ${project.name}`,
        notes: payload.notes ?? null,
        status: 'draft',
        created_by: profile!.id,
      } as never)
      .select(QUOTE_SELECT)
      .single()

    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'project',
      entityId: payload.project_id,
      eventType: 'quote.created',
      title: 'Orçamento criado',
      detail: `v${version}`,
      actorId: profile!.id,
      cachePrefix: 'project_quotes',
    })

    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
