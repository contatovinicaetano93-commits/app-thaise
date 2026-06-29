import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'

export interface OrderNotificationRow {
  order_id: string
  channel: 'whatsapp' | 'email' | 'in_app'
  status: 'sent' | 'failed' | 'stub'
  recipient: string | null
  error: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

/** Resumo de notificações por pedido (gestor) */
export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('order_notifications')
      .select('order_id, channel, status, recipient, error, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      if (error.message.includes('does not exist')) return ok({})
      return err(error.message, 500)
    }

    const byOrder: Record<string, OrderNotificationRow[]> = {}
    for (const row of data ?? []) {
      const r = row as OrderNotificationRow
      if (!byOrder[r.order_id]) byOrder[r.order_id] = []
      if (byOrder[r.order_id].length < 3) byOrder[r.order_id].push(r)
    }

    return ok(byOrder)
  } catch (e) {
    return handleError(e)
  }
}
