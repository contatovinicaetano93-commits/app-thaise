import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = createServiceClient()
    const { data, error } = await db
      .from('job_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return ok([])

    const counts = {
      pending: ((data ?? []) as Array<{ status: string }>).filter(j => j.status === 'pending').length,
      processing: ((data ?? []) as Array<{ status: string }>).filter(j => j.status === 'processing').length,
      completed: ((data ?? []) as Array<{ status: string }>).filter(j => j.status === 'completed').length,
      failed: ((data ?? []) as Array<{ status: string }>).filter(j => j.status === 'failed').length,
    }

    return ok(data ?? [], { counts })
  } catch (e) {
    return handleError(e)
  }
}
