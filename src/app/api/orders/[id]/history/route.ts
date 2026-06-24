import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { listOrderHistory } from '@/lib/memory/events'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const history = await listOrderHistory(id)
    return ok(history)
  } catch (e) {
    return handleError(e)
  }
}
