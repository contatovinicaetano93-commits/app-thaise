import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { BRIEFING_QUESTIONS } from '@/lib/briefing'

const briefingSchema = z.object({
  briefing_type: z.enum(['corporativo', 'residencial', 'comercial', 'desenvolvimento']),
  briefing_data: z.record(z.string(), z.string()),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()
    const { data, error } = await db.from('opportunities').select('briefing_type, briefing_data').eq('id', id).single()
    if (error) return err(error.message, 500)
    const row = data as { briefing_type?: string; briefing_data?: Record<string, string> } | null
    const type = (row?.briefing_type ?? 'residencial') as keyof typeof BRIEFING_QUESTIONS
    return ok({ questions: BRIEFING_QUESTIONS[type], briefing_data: row?.briefing_data ?? {} })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const body = briefingSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data, error } = await db
      .from('opportunities')
      .update({
        briefing_type: body.briefing_type,
        briefing_data: body.briefing_data,
        stage: 'briefing',
      } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: id,
      eventType: 'opportunity.briefing',
      title: 'Briefing estratégico registrado',
      detail: body.briefing_type,
      actorId: profile!.id,
      cachePrefix: 'opportunities',
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
