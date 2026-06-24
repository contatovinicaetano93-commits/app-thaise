import { Worker } from 'bullmq'
import type { OrderJobPayload, OrderJobType } from '@/lib/queue/types'
import { processOrderJob } from '@/lib/queue/processors'

const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  console.error('REDIS_URL não configurada. Worker não iniciado.')
  process.exit(1)
}

const worker = new Worker<OrderJobPayload>(
  'orders',
  async (job) => {
    console.info(`[worker] ${job.name} — ${job.id}`)
    return processOrderJob(job.name as OrderJobType, job.data)
  },
  { connection: { url: redisUrl, maxRetriesPerRequest: null }, concurrency: 3 },
)

worker.on('completed', (job) => console.info(`[worker] ✓ ${job.id}`))
worker.on('failed', (job, err) => console.error(`[worker] ✗ ${job?.id}`, err.message))

console.info('[worker] BullMQ order worker rodando...')
