import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'

const diarySchema = z.object({
  week_start: z.string().optional(),
  planned: z.string().optional().nullable(),
  actual: z.string().optional().nullable(),
  risks: z.string().optional().nullable(),
})

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('project_diary_entries')
      .select('*')
      .eq('project_id', id)
      .order('week_start', { ascending: false })
      .limit(12)
    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const body = diarySchema.parse(await req.json())
    const db = await createSupabaseServer()
    const week_start = body.week_start ?? getWeekStart()

    const { data, error } = await db
      .from('project_diary_entries')
      .upsert({
        project_id: id,
        week_start,
        planned: body.planned ?? null,
        actual: body.actual ?? null,
        risks: body.risks ?? null,
      } as never, { onConflict: 'project_id,week_start' })
      .select()
      .single()

    if (error) return err(error.message, 500)
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
