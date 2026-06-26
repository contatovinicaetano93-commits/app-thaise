import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { checkProjectCap } from '@/lib/estlar/cap'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const cap = await checkProjectCap()
    return ok(cap)
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const body = await req.json() as { max?: number; label?: string }
    const { createSupabaseServer } = await import('@/lib/supabase/server')
    const db = await createSupabaseServer()

    const { data: existing } = await db
      .from('operational_config')
      .select('value')
      .eq('key', 'project_cap_quarter')
      .maybeSingle()

    const current = (existing as { value?: { max: number; label: string } } | null)?.value
      ?? { max: 12, label: 'Cap trimestral Estlar' }

    const value = {
      max: body.max ?? current.max,
      label: body.label ?? current.label,
    }

    await db.from('operational_config').upsert({
      key: 'project_cap_quarter',
      value,
      updated_at: new Date().toISOString(),
    } as never)

    const cap = await checkProjectCap()
    return ok(cap)
  } catch (e) {
    return handleError(e)
  }
}
