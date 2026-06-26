import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { assertEntityAccess } from '@/lib/auth/entity-access'
import { listOrderHistory } from '@/lib/memory/events'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const accessErr = await assertEntityAccess(profile!, 'order', id)
    if (accessErr) return accessErr

    const history = await listOrderHistory(id)
    return ok(history)
  } catch (e) {
    return handleError(e)
  }
}
