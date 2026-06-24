import { ok, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { getSupabaseUrl } from '@/lib/supabase/env'

export async function GET() {
  try {
    const db = createServerClient()
    const start = Date.now()
    const { error } = await db.from('suppliers').select('id', { count: 'exact', head: true })
    const dbMs = Date.now() - start

    const redisUrl = process.env.REDIS_URL
    let redis: 'ok' | 'skipped' | 'error' = redisUrl ? 'error' : 'skipped'

    if (redisUrl) {
      try {
        const { Queue } = await import('bullmq')
        const q = new Queue('orders', { connection: { url: redisUrl, maxRetriesPerRequest: null } })
        await q.getJobCounts()
        await q.close()
        redis = 'ok'
      } catch {
        redis = 'error'
      }
    }

    return ok({
      status: error ? 'degraded' : 'ok',
      version: process.env.npm_package_version ?? '0.1.0',
      db: error ? 'error' : 'ok',
      dbMs,
      redis,
      supabase: getSupabaseUrl() ? 'configured' : 'missing',
      timestamp: new Date().toISOString(),
      error: error?.message,
    })
  } catch (e) {
    return handleError(e)
  }
}
