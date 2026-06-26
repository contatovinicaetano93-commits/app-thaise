import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { scoreProject } from '@/lib/agents/scoring-agent'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const result = await scoreProject(id)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
