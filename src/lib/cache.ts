const DEFAULT_TTL_SEC = 60

let redisClient: import('ioredis').default | null = null

async function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null

  if (!redisClient) {
    const { default: Redis } = await import('ioredis')
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    })
    await redisClient.connect()
  }

  return redisClient
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedis()
    if (!redis) return null
    const raw = await redis.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec = DEFAULT_TTL_SEC) {
  try {
    const redis = await getRedis()
    if (!redis) return
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec)
  } catch {
    // cache miss-safe
  }
}

export async function cacheDel(pattern: string) {
  try {
    const redis = await getRedis()
    if (!redis) return
    const keys = await redis.keys(pattern)
    if (keys.length) await redis.del(...keys)
  } catch {
    // ignore
  }
}

export async function invalidateListCaches(prefix: string) {
  await cacheDel(`${prefix}:*`)
}
