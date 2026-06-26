import { Worker } from 'bullmq'
import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { processOrderJob } from '@/lib/queue/processors'
import { updateJobLog } from '@/lib/queue/job-log'

const redisUrl = process.env.REDIS_URL

export function startOrderWorker() {
  if (!redisUrl) return null

  const worker = new Worker<OrderJobPayload>(
    'orders',
    async (job) => {
      const { jobLogId, ...payload } = job.data
      console.info(`[order-worker] ${job.name} — ${job.id}`)
      if (jobLogId) await updateJobLog(jobLogId, 'processing')
      try {
        const result = await processOrderJob(job.name as OrderJobType, payload)
        if (jobLogId) await updateJobLog(jobLogId, 'completed', result)
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro desconhecido'
        if (jobLogId) await updateJobLog(jobLogId, 'failed', undefined, msg)
        throw e
      }
    },
    { connection: { url: redisUrl, maxRetriesPerRequest: null }, concurrency: 3 },
  )

  worker.on('completed', (job) => console.info(`[order-worker] ✓ ${job.id}`))
  worker.on('failed', (job, err) => console.error(`[order-worker] ✗ ${job?.id}`, err.message))
  console.info('[order-worker] BullMQ order worker rodando...')
  return worker
}

if (process.argv[1]?.includes('order.worker')) {
  if (!redisUrl) {
    console.error('REDIS_URL não configurada. Worker não iniciado.')
    process.exit(1)
  }
  startOrderWorker()
}
