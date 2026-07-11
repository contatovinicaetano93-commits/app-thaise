import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { PAYMENT_SELECT, syncPaymentAuditLink } from '@/lib/payments/server'
import { findEligibleReleaseAudit, releaseBlockReason } from '@/lib/payments/escrow'
import type { PhaseChecklist } from '@/lib/auth/roles'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id: paymentId } = await params
    const db = await createSupabaseServer()

    const { data: payment } = await db
      .from('order_payments')
      .select(PAYMENT_SELECT)
      .eq('id', paymentId)
      .single()

    if (!payment) return err('Pagamento não encontrado', 404)

    const row = payment as { supplier_id: string; project_id: string | null; status: string }
    if (profile!.role === 'fornecedor' && profile!.supplier_id !== row.supplier_id) {
      return err('Acesso negado', 403)
    }
    if (profile!.role === 'cliente') return err('Acesso negado', 403)

    if (profile!.role === 'gestor' && row.status === 'held') {
      await syncPaymentAuditLink(paymentId)
      const { data: refreshed } = await db.from('order_payments').select(PAYMENT_SELECT).eq('id', paymentId).single()
      if (refreshed) {
        const p = refreshed as { project_id: string | null }
        let eligible = null
        let blockReason = ''
        if (p.project_id) {
          const { data: project } = await db.from('projects').select('checklist').eq('id', p.project_id).single() as {
            data: { checklist: PhaseChecklist } | null
          }
          eligible = findEligibleReleaseAudit(project?.checklist)
          blockReason = eligible ? '' : releaseBlockReason(project?.checklist)
        }
        return ok({ payment: refreshed, eligible_audit: eligible, can_release: Boolean(eligible), block_reason: blockReason })
      }
    }

    return ok({ payment, can_release: false })
  } catch (e) {
    return handleError(e)
  }
}
