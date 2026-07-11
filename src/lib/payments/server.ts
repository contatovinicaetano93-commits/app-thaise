import { createServiceClient } from '@/lib/supabase-server'
import { findEligibleReleaseAudit } from '@/lib/payments/escrow'
import type { PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'

export type OrderPaymentStatus = 'held' | 'released' | 'blocked' | 'cancelled'

export interface OrderPayment {
  id: string
  order_id: string
  project_id?: string | null
  supplier_id: string
  amount: number
  status: OrderPaymentStatus
  checklist_phase?: ProjectPhase | null
  checklist_item_id?: string | null
  audit_status?: string | null
  audit_score?: number | null
  held_at: string
  released_at?: string | null
  released_by?: string | null
  release_notes?: string | null
  pix_reference?: string | null
  payment_method: 'escrow' | 'manual_pix'
  created_at: string
  updated_at: string
  order?: {
    id: string
    total_price: number
    status: string
    product?: { name: string } | null
    supplier?: { id: string; name: string } | null
    project?: { id: string; name: string } | null
    client?: { name: string } | null
  }
}

export const PAYMENT_SELECT = `
  *,
  order:orders(
    id, total_price, status, quantity, unit_price,
    product:products(id, name, unit),
    supplier:suppliers(id, name),
    project:projects(id, name),
    client:clients(id, name)
  )
`

export async function createHeldPaymentForOrder(orderId: string): Promise<OrderPayment | null> {
  const db = createServiceClient()

  const { data: existing } = await db
    .from('order_payments')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return null

  const { data: order } = await db
    .from('orders')
    .select('id, project_id, supplier_id, total_price, status')
    .eq('id', orderId)
    .single() as {
    data: { id: string; project_id: string | null; supplier_id: string; total_price: number; status: string } | null
  }

  if (!order || order.status !== 'delivered') return null

  let checklistPhase: ProjectPhase | null = null
  let checklistItemId: string | null = null
  let auditStatus: string | null = null
  let auditScore: number | null = null

  if (order.project_id) {
    const { data: project } = await db
      .from('projects')
      .select('checklist')
      .eq('id', order.project_id)
      .single() as { data: { checklist: PhaseChecklist } | null }

    const eligible = findEligibleReleaseAudit(project?.checklist)
    if (eligible) {
      checklistPhase = eligible.phase
      checklistItemId = eligible.itemId
      auditStatus = eligible.audit.status
      auditScore = eligible.audit.score
    }
  }

  const { data, error } = await db
    .from('order_payments')
    .insert({
      order_id: order.id,
      project_id: order.project_id,
      supplier_id: order.supplier_id,
      amount: order.total_price,
      status: 'held',
      checklist_phase: checklistPhase,
      checklist_item_id: checklistItemId,
      audit_status: auditStatus,
      audit_score: auditScore,
    } as never)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as OrderPayment
}

export async function syncPaymentAuditLink(paymentId: string) {
  const db = createServiceClient()
  const { data: payment } = await db
    .from('order_payments')
    .select('id, project_id, status')
    .eq('id', paymentId)
    .single() as { data: { id: string; project_id: string | null; status: string } | null }

  if (!payment?.project_id || payment.status !== 'held') return

  const { data: project } = await db
    .from('projects')
    .select('checklist')
    .eq('id', payment.project_id)
    .single() as { data: { checklist: PhaseChecklist } | null }

  const eligible = findEligibleReleaseAudit(project?.checklist)
  if (!eligible) return

  await db.from('order_payments').update({
    checklist_phase: eligible.phase,
    checklist_item_id: eligible.itemId,
    audit_status: eligible.audit.status,
    audit_score: eligible.audit.score,
  } as never).eq('id', paymentId)
}

export async function syncHeldPaymentsForProject(projectId: string) {
  const db = createServiceClient()
  const { data: payments } = await db
    .from('order_payments')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'held')

  for (const row of payments ?? []) {
    await syncPaymentAuditLink((row as { id: string }).id)
  }
}
