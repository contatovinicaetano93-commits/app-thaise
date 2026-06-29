import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { QUOTE_SELECT } from '@/lib/quotes/server'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { notifyClientUsers, notifyClientEmail } from '@/lib/notify/portal-notify'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const db = await createSupabaseServer()

    const { data: quote } = await db
      .from('project_quotes')
      .select('id, project_id, client_id, status, title, lines:project_quote_lines(id)')
      .eq('id', id)
      .single() as { data: { id: string; project_id: string; client_id: string; status: string; title: string; lines: { id: string }[] } | null }

    if (!quote) return err('Orçamento não encontrado', 404)
    if (quote.status !== 'draft') return err('Só rascunhos podem ser enviados', 422)
    if (!quote.lines?.length) return err('Adicione pelo menos um item ao orçamento', 422)

    const { data: project } = await db
      .from('projects')
      .select('portal_enabled, name')
      .eq('id', quote.project_id)
      .single() as { data: { portal_enabled: boolean; name: string } | null }

    if (!project?.portal_enabled) {
      return err('Libere o portal da obra antes de enviar o orçamento ao cliente', 422)
    }

    const { data, error } = await db
      .from('project_quotes')
      .update({ status: 'sent', sent_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select(QUOTE_SELECT)
      .single()

    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'project',
      entityId: quote.project_id,
      eventType: 'quote.sent',
      title: 'Orçamento enviado ao cliente',
      detail: quote.title,
      actorId: profile!.id,
      cachePrefix: 'project_quotes',
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app-thaise.vercel.app'
    const obra = project?.name ?? 'sua obra'
    await notifyClientUsers(
      quote.client_id,
      'Orçamento aguardando sua aprovação',
      `${quote.title} — ${obra}`,
      '/quotes',
    )
    await notifyClientEmail(
      quote.client_id,
      `Estlar — Orçamento para aprovação · ${obra}`,
      [
        `A Estlar enviou o orçamento "${quote.title}" para a obra ${obra}.`,
        'Acesse o portal para aprovar ou rejeitar:',
        `${appUrl}/quotes`,
      ].join('\n'),
    )

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
