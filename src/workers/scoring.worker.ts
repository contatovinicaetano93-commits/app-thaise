import { Worker } from 'bullmq'
import { scoreSupplier } from '@/lib/agents/scoring-agent'

const redisUrl = process.env.REDIS_URL

export function startScoringWorker() {
  if (!redisUrl) return null

  const worker = new Worker<{ supplierId: string; projectId?: string }>(
    'scoring',
    async (job) => {
      const { supplierId, projectId } = job.data
      const scoring = await scoreSupplier(supplierId)
      if (projectId) {
        const { scoreProject } = await import('@/lib/agents/scoring-agent')
        await scoreProject(projectId)
      }
      return { supplierId, scoring }
    },
    { connection: { url: redisUrl, maxRetriesPerRequest: null }, concurrency: 2 },
  )

  worker.on('completed', (job) => console.info(`[scoring-worker] ✓ ${job.id}`))
  worker.on('failed', (job, err) => console.error(`[scoring-worker] ✗ ${job?.id}`, err.message))
  console.info('[scoring-worker] rodando...')
  return worker
}

if (process.argv[1]?.includes('scoring.worker')) {
  if (!redisUrl) {
    console.error('REDIS_URL não configurada.')
    process.exit(1)
  }
  startScoringWorker()
}
