import type { OrderJobPayload } from '@/lib/queue/types'

export async function createJobLog(jobType: string, payload: OrderJobPayload): Promise<string | undefined> {
  try {
    const { createServiceClient } = await import('@/lib/supabase-server')
    const db = createServiceClient()
    const { data } = await db.from('job_logs').insert({
      job_type: jobType,
      payload: payload as unknown as Record<string, unknown>,
      status: 'pending',
    } as never).select('id').single() as { data: { id: string } | null }
    return data?.id
  } catch (e) {
    console.error('[job_logs] create', e)
    return undefined
  }
}

export async function updateJobLog(
  jobLogId: string,
  status: 'processing' | 'completed' | 'failed',
  result?: Record<string, unknown>,
  error?: string,
) {
  try {
    const { createServiceClient } = await import('@/lib/supabase-server')
    const db = createServiceClient()
    await db.from('job_logs').update({
      status,
      result: result ?? null,
      error: error ?? null,
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    } as never).eq('id', jobLogId)
  } catch (e) {
    console.error('[job_logs] update', e)
  }
}
