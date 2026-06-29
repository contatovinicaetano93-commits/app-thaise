import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { assertEntityAccess } from '@/lib/auth/entity-access'
import { buildProjectIntelligence } from '@/lib/projects/intelligence'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const accessErr = await assertEntityAccess(profile!, 'project', id)
    if (accessErr) return accessErr

    const intelligence = await buildProjectIntelligence(id)
    return ok(intelligence)
  } catch (e) {
    return handleError(e)
  }
}
