import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { ORDER_QUEUE_NAME } from '@/lib/queue/types'
import { jobKey, isJobProcessed } from '@/lib/queue/idempotency'

async function logJob(
  jobType: string,
  payload: OrderJobPayload,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  result?: Record<string, unknown>,
  error?: string,
  jobLogId?: string,
) {
  try {
    const { createServiceClient } = await import('@/lib/supabase-server')
    const db = createServiceClient()
    if (jobLogId && (status === 'completed' || status === 'failed')) {
      await db.from('job_logs').update({
        status,
        result: result ?? null,
        error: error ?? null,
        completed_at: new Date().toISOString(),
      } as never).eq('id', jobLogId)
      return
    }
    await db.from('job_logs').insert({
      job_type: jobType,
      payload: payload as unknown as Record<string, unknown>,
      status,
      result: result ?? null,
      error: error ?? null,
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    } as never)
  } catch (e) {
    console.error('[job_logs]', e)
  }
}

async function processInline(jobType: OrderJobType, payload: OrderJobPayload) {
  const key = jobKey(jobType, payload.orderId)
  if (await isJobProcessed(key)) {
    return { action: 'skipped', reason: 'already_processed', orderId: payload.orderId }
  }

  await logJob(jobType, payload, 'processing')
  try {
    const { processOrderJob } = await import('@/lib/queue/processors')
    const result = await processOrderJob(jobType, payload)
    await logJob(jobType, payload, 'completed', result)
    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    await logJob(jobType, payload, 'failed', undefined, msg)
    throw e
  }
}

export async function retryFailedJob(jobLogId: string) {
  const { createServiceClient } = await import('@/lib/supabase-server')
  const db = createServiceClient()
  const { data } = await db.from('job_logs').select('*').eq('id', jobLogId).single() as {
    data: { id: string; job_type: string; payload: OrderJobPayload; status: string } | null
  }
  if (!data || data.status !== 'failed') throw new Error('Job não encontrado ou não está falho')

  const jobType = data.job_type as OrderJobType
  const payload = data.payload
  await logJob(jobType, payload, 'processing', undefined, undefined, jobLogId)

  try {
    const { processOrderJob } = await import('@/lib/queue/processors')
    const result = await processOrderJob(jobType, payload)
    await logJob(jobType, payload, 'completed', result, undefined, jobLogId)
    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    await logJob(jobType, payload, 'failed', undefined, msg, jobLogId)
    throw e
  }
}

export async function enqueueOrderJob(jobType: OrderJobType, payload: OrderJobPayload) {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    return processInline(jobType, payload)
  }

  await logJob(jobType, payload, 'pending')

  const { Queue } = await import('bullmq')

  const queue = new Queue(ORDER_QUEUE_NAME, {
    connection: { url: redisUrl, maxRetriesPerRequest: null },
  })

  await queue.add(jobType, payload, {
    jobId: jobKey(jobType, payload.orderId),
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  })

  await queue.close()
}
