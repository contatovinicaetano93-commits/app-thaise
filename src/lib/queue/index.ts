import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { ORDER_QUEUE_NAME } from '@/lib/queue/types'
import { jobKey, isJobProcessed } from '@/lib/queue/idempotency'
import { createJobLog, updateJobLog } from '@/lib/queue/job-log'

async function processInline(jobType: OrderJobType, payload: OrderJobPayload) {
  const key = jobKey(jobType, payload.orderId)
  if (await isJobProcessed(key)) {
    return { action: 'skipped', reason: 'already_processed', orderId: payload.orderId }
  }

  const jobLogId = await createJobLog(jobType, payload)
  if (jobLogId) await updateJobLog(jobLogId, 'processing')

  try {
    const { processOrderJob } = await import('@/lib/queue/processors')
    const result = await processOrderJob(jobType, payload)
    if (jobLogId) await updateJobLog(jobLogId, 'completed', result)
    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    if (jobLogId) await updateJobLog(jobLogId, 'failed', undefined, msg)
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
  await updateJobLog(jobLogId, 'processing')

  try {
    const { processOrderJob } = await import('@/lib/queue/processors')
    const result = await processOrderJob(jobType, payload)
    await updateJobLog(jobLogId, 'completed', result)
    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    await updateJobLog(jobLogId, 'failed', undefined, msg)
    throw e
  }
}

export async function enqueueOrderJob(jobType: OrderJobType, payload: OrderJobPayload) {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    return processInline(jobType, payload)
  }

  const jobLogId = await createJobLog(jobType, payload)
  const queuePayload: OrderJobPayload = { ...payload, jobLogId }

  const { Queue } = await import('bullmq')

  const queue = new Queue(ORDER_QUEUE_NAME, {
    connection: { url: redisUrl, maxRetriesPerRequest: null },
  })

  await queue.add(jobType, queuePayload, {
    jobId: jobKey(jobType, payload.orderId),
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  })

  await queue.close()
}
