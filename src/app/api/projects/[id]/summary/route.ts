import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { summarizeProject } from '@/lib/agents/summary-agent'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const result = await summarizeProject(id)
    return ok(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    if (msg.includes('não encontrado')) return err(msg, 404)
    return handleError(e)
  }
}
