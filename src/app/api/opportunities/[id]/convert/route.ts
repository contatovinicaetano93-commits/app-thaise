import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { convertOpportunity } from '@/lib/pipeline/convert'

const schema = z.object({
  project_name: z.string().min(2).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { project_name } = schema.parse(body)

    const result = await convertOpportunity(id, profile!.id, project_name)
    return ok(result, undefined, 201)
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('já convertida') || e.message.includes('perdida') || e.message.includes('cadastrado')) {
        return err(e.message, 422)
      }
      return err(e.message, 500)
    }
    return handleError(e)
  }
}
