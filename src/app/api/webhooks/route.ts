import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const { data, error } = await db.from('webhooks').select('*').order('created_at', { ascending: false })
    if (error) return ok([])
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { url, events } = await req.json() as { url: string; events?: string[] }
    if (!url) return err('url é obrigatória', 422)

    const db = await createSupabaseServer()
    const secret = randomBytes(16).toString('hex')

    const { data, error } = await db.from('webhooks').insert({
      url,
      events: events ?? ['order.approved', 'order.delivered', 'project.phase_advanced'],
      secret,
      active: true,
    } as never).select().single()

    if (error) return err(error.message, 500)
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
