import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { listActivity } from '@/lib/memory/events'
import type { EntityType } from '@/lib/memory/events'

export async function GET(req: NextRequest) {
  try {
    const { error: authErr } = await requireProfile()
    if (authErr) return authErr

    const entityType = req.nextUrl.searchParams.get('entity_type') as EntityType | null
    const entityId = req.nextUrl.searchParams.get('entity_id')

    if (!entityType || !entityId) return err('entity_type e entity_id são obrigatórios', 422)

    const events = await listActivity(entityType, entityId)
    return ok(events)
  } catch (e) {
    return handleError(e)
  }
}
