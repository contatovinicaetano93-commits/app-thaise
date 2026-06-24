import { createServiceClient } from '@/lib/supabase-server'

export function jobKey(jobType: string, orderId: string) {
  return `${jobType}:${orderId}`
}

export async function isJobProcessed(key: string): Promise<boolean> {
  try {
    const db = createServiceClient()
    const { data } = await db.from('processed_jobs').select('id').eq('job_key', key).maybeSingle()
    return !!data
  } catch {
    return false
  }
}

export async function markJobProcessed(
  key: string,
  jobType: string,
  orderId: string,
  result?: Record<string, unknown>,
) {
  try {
    const db = createServiceClient()
    await db.from('processed_jobs').insert({
      job_key: key,
      job_type: jobType,
      order_id: orderId,
      result: result ?? null,
    } as never)
  } catch (e) {
    console.error('[processed_jobs]', e)
  }
}
