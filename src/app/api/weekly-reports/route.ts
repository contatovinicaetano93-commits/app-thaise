import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, requireGestor } from '@/lib/auth/api-context'
import { notifyUser } from '@/lib/webhooks/dispatch'

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const status = req.nextUrl.searchParams.get('status')
    const db = await createSupabaseServer()

    if (profile!.role === 'fornecedor') {
      return err('Acesso restrito', 403)
    }

    let query = db
      .from('weekly_reports')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(50)

    if (profile!.role === 'cliente') {
      query = query.eq('status', 'sent')
    } else if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'approved', 'sent']),
})

export async function PATCH(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const body = patchSchema.parse(await req.json())
    const db = await createSupabaseServer()
    const now = new Date().toISOString()
    const updates: Record<string, string> = { status: body.status }
    if (body.status === 'approved') updates.approved_at = now
    if (body.status === 'sent') {
      updates.sent_at = now
      if (!updates.approved_at) updates.approved_at = now
    }

    const { data, error } = await db
      .from('weekly_reports')
      .update(updates as never)
      .eq('id', body.id)
      .select('*, project:projects(name, client_id)')
      .single()

    if (error) return err(error.message, 500)

    if (body.status === 'sent' && data) {
      const report = data as {
        week_label?: string
        project?: { name?: string; client_id?: string } | null
      }
      const clientId = report.project?.client_id
      if (clientId) {
        const { data: clientProfiles } = await db
          .from('profiles')
          .select('id')
          .eq('role', 'cliente')
          .eq('client_id', clientId)
          .limit(5)

        for (const p of clientProfiles ?? []) {
          await notifyUser(
            (p as { id: string }).id,
            `Relatório 360 — ${report.project?.name ?? 'Projeto'}`,
            report.week_label ?? 'Atualização semanal disponível',
            '/reports/weekly',
          )
        }
      }
    }

    void profile
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
