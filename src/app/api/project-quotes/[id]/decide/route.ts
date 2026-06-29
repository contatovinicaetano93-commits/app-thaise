import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/api-context'
import { QUOTE_SELECT } from '@/lib/quotes/server'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { refreshProjectReport } from '@/lib/projects/intelligence'

const schema = z.object({
  decision: z.enum(['approve', 'reject']),
  rejection_note: z.string().optional().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'cliente') return err('Apenas o cliente pode aprovar orçamentos', 403)

    const { id } = await params
    const { decision, rejection_note } = schema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: quote } = await db
      .from('project_quotes')
      .select('id, project_id, client_id, status, title')
      .eq('id', id)
      .single() as { data: { id: string; project_id: string; client_id: string; status: string; title: string } | null }

    if (!quote) return err('Orçamento não encontrado', 404)
    if (quote.client_id !== profile!.client_id) return err('Acesso negado', 403)
    if (quote.status !== 'sent') return err('Este orçamento não está aguardando sua decisão', 422)

    const newStatus = decision === 'approve' ? 'approved' : 'rejected'

    const { data, error } = await db
      .from('project_quotes')
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by: profile!.id,
        rejection_note: decision === 'reject' ? (rejection_note ?? null) : null,
      } as never)
      .eq('id', id)
      .select(QUOTE_SELECT)
      .single()

    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'project',
      entityId: quote.project_id,
      eventType: decision === 'approve' ? 'quote.approved' : 'quote.rejected',
      title: decision === 'approve' ? 'Cliente aprovou orçamento' : 'Cliente rejeitou orçamento',
      detail: quote.title,
      actorId: profile!.id,
      cachePrefix: 'project_quotes',
    })

    if (decision === 'approve') {
      refreshProjectReport(quote.project_id).catch(console.error)
    }

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
