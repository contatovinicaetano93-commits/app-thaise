import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { cacheGet, cacheSet } from '@/lib/cache'
import { ACTIVE_PIPELINE_STAGES } from '@/lib/pipeline'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().optional().transform(v => v || null),
  source: z.enum(['whatsapp', 'indicacao', 'instagram', 'parceiro', 'evento', 'outro']).default('whatsapp'),
  budget_estimate: z.coerce.number().positive().optional().nullable().transform(v => v ?? null),
  notes: z.string().optional().transform(v => v || null),
  stage: z.enum(['primeiro_contato', 'briefing', 'viabilidade_previa', 'proposta', 'contrato']).default('primeiro_contato'),
})

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const includeClosed = req.nextUrl.searchParams.get('include_closed') === '1'
    const cacheKey = `opportunities:${includeClosed}`
    const cached = await cacheGet<unknown[]>(cacheKey)
    if (cached) return ok(cached)

    const db = createServerClient()
    let query = db
      .from('opportunities')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!includeClosed) {
      query = query.in('stage', ACTIVE_PIPELINE_STAGES)
    }

    const { data, error } = await query
    if (error) return err(error.message, 500)

    await cacheSet(cacheKey, data ?? [])
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const body = await req.json()
    const payload = createSchema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('opportunities')
      .insert(payload as never)
      .select()
      .single()

    if (error) return err(error.message, 500)

    const row = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: row.id,
      eventType: 'opportunity.created',
      title: 'Oportunidade criada',
      detail: row.name,
      actorId: profile!.id,
      cachePrefix: 'opportunities',
    })

    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
