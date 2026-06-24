import { logActivity, type EntityType } from '@/lib/memory/events'
import { invalidateListCaches } from '@/lib/cache'

export async function auditAndInvalidate(input: {
  entityType: EntityType
  entityId: string
  eventType: string
  title: string
  detail?: string
  actorId?: string | null
  cachePrefix?: string
  metadata?: Record<string, unknown>
}) {
  await logActivity({
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType,
    title: input.title,
    detail: input.detail,
    actorId: input.actorId,
    metadata: input.metadata,
  })
  if (input.cachePrefix) {
    await invalidateListCaches(input.cachePrefix)
  }
}
