import { Worker } from 'bullmq'
import { createServiceClient } from '@/lib/supabase-server'

const redisUrl = process.env.REDIS_URL

export interface NotifyJobPayload {
  userId: string
  title: string
  body: string
  href?: string
}

export function startNotifyWorker() {
  if (!redisUrl) return null

  const worker = new Worker<NotifyJobPayload>(
    'notifications',
    async (job) => {
      const db = createServiceClient()
      await db.from('notifications').insert({
        user_id: job.data.userId,
        title: job.data.title,
        body: job.data.body,
        href: job.data.href ?? null,
        read: false,
      } as never)
      return { delivered: true }
    },
    { connection: { url: redisUrl, maxRetriesPerRequest: null }, concurrency: 5 },
  )

  worker.on('completed', (job) => console.info(`[notify-worker] ✓ ${job.id}`))
  worker.on('failed', (job, err) => console.error(`[notify-worker] ✗ ${job?.id}`, err.message))
  console.info('[notify-worker] rodando...')
  return worker
}

if (process.argv[1]?.includes('notify.worker')) {
  if (!redisUrl) {
    console.error('REDIS_URL não configurada.')
    process.exit(1)
  }
  startNotifyWorker()
}
