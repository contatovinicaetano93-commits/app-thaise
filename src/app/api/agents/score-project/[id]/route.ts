import { ok, handleError } from '@/lib/api-response'
import { scoreProject } from '@/lib/agents/scoring-agent'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await scoreProject(id)
    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
