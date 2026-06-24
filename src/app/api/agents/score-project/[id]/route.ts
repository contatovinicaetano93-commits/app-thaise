import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { scoreProject } from '@/lib/agents/scoring-agent'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const result = await scoreProject(id)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
