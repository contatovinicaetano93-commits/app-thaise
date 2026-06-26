import { createServiceClient } from '@/lib/supabase-server'

export type EntityType = 'project' | 'order' | 'supplier' | 'client' | 'product' | 'opportunity'

export interface ActivityEvent {
  id: string
  entity_type: EntityType
  entity_id: string
  event_type: string
  title: string
  detail?: string | null
  metadata?: Record<string, unknown> | null
  actor_id?: string | null
  created_at: string
}

export interface OrderStatusLogEntry {
  id: string
  order_id: string
  from_status: string | null
  to_status: string
  changed_by?: string | null
  note?: string | null
  created_at: string
}

export async function logActivity(input: {
  entityType: EntityType
  entityId: string
  eventType: string
  title: string
  detail?: string
  metadata?: Record<string, unknown>
  actorId?: string | null
}) {
  try {
    const db = createServiceClient()
    await db.from('activity_events').insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      event_type: input.eventType,
      title: input.title,
      detail: input.detail ?? null,
      metadata: input.metadata ?? {},
      actor_id: input.actorId ?? null,
    } as never)
  } catch (e) {
    console.error('[activity_events]', e)
  }
}

export async function logOrderStatus(input: {
  orderId: string
  fromStatus: string | null
  toStatus: string
  changedBy?: string | null
  note?: string
}) {
  try {
    const db = createServiceClient()
    await db.from('order_status_log').insert({
      order_id: input.orderId,
      from_status: input.fromStatus,
      to_status: input.toStatus,
      changed_by: input.changedBy ?? null,
      note: input.note ?? null,
    } as never)
  } catch (e) {
    console.error('[order_status_log]', e)
  }
}

export async function listActivity(entityType: EntityType, entityId: string, limit = 30) {
  const db = await (await import('@/lib/supabase/server')).createSupabaseServer()
  const { data } = await db
    .from('activity_events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as ActivityEvent[]
}

export async function listOrderHistory(orderId: string) {
  const db = await (await import('@/lib/supabase/server')).createSupabaseServer()
  const { data } = await db
    .from('order_status_log')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  return (data ?? []) as OrderStatusLogEntry[]
}
