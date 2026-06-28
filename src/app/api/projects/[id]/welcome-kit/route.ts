import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/api-context'
import { assertEntityAccess } from '@/lib/auth/entity-access'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const accessErr = await assertEntityAccess(profile!, 'project', id)
    if (accessErr) return accessErr

    const db = await createSupabaseServer()
    const { data, error } = await db.from('welcome_kits').select('*').eq('project_id', id).maybeSingle()
    if (error) return err(error.message, 500)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
