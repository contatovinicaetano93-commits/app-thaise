/**
 * Rate limiter — Redis compartilhado quando REDIS_URL existe, senão in-memory.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  bucket.count++
  if (bucket.count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: limit - bucket.count }
}

let redisClient: import('ioredis').default | null = null

async function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null
  if (!redisClient) {
    const { default: Redis } = await import('ioredis')
    redisClient = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 2000, lazyConnect: true })
    await redisClient.connect()
  }
  return redisClient
}

async function redisRateLimit(key: string, limit: number, windowMs: number) {
  const redis = await getRedis()
  if (!redis) return memoryRateLimit(key, limit, windowMs)

  const redisKey = `rl:${key}`
  const count = await redis.incr(redisKey)
  if (count === 1) await redis.pexpire(redisKey, windowMs)
  if (count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: Math.max(0, limit - count) }
}

/** @deprecated use rateLimitAsync in middleware */
export function rateLimit(ip: string, limit = 60, windowMs = 60_000) {
  return memoryRateLimit(ip, limit, windowMs)
}

export async function rateLimitAsync(key: string, limit = 60, windowMs = 60_000) {
  try {
    return await redisRateLimit(key, limit, windowMs)
  } catch {
    return memoryRateLimit(key, limit, windowMs)
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, b] of buckets) {
      if (now > b.resetAt) buckets.delete(ip)
    }
  }, 120_000)
}
