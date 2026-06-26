import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { upsertWeeklyReportDraft, generateWeeklyReportDraft, formatWeeklyReportEmail } from '@/lib/estlar/weekly-report'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('weekly_reports')
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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const data = await upsertWeeklyReportDraft(id)
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()
    const { data: project } = await db
      .from('projects')
      .select('name, clients(name)')
      .eq('id', id)
      .single()

    const draft = await generateWeeklyReportDraft(id)
    const proj = project as { name: string; clients?: { name?: string } } | null
    const email = formatWeeklyReportEmail({
      clientName: proj?.clients?.name ?? 'Cliente',
      projectName: proj?.name ?? 'Projeto',
      report: draft,
    })
    return ok({ draft, email })
  } catch (e) {
    return handleError(e)
  }
}
