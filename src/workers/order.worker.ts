import { Worker } from 'bullmq'
import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { processOrderJob } from '@/lib/queue/processors'

const redisUrl = process.env.REDIS_URL

export function startOrderWorker() {
  if (!redisUrl) return null

  const worker = new Worker<OrderJobPayload>(
    'orders',
    async (job) => {
      console.info(`[order-worker] ${job.name} — ${job.id}`)
      return processOrderJob(job.name as OrderJobType, job.data)
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
