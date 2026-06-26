import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { listAppUsers } from '@/lib/auth/invite-user'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const users = await listAppUsers()
    return ok(users)
  } catch (e) {
    return handleError(e)
  }
}
