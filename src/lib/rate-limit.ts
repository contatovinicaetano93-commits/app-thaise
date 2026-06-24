/**
 * Rate limiter in-memory simples (por IP, janela deslizante)
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ip: string, limit = 60, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  bucket.count++
  if (bucket.count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: limit - bucket.count }
}

// Limpa buckets antigos periodicamente
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, b] of buckets) {
      if (now > b.resetAt) buckets.delete(ip)
    }
  }, 120_000)
}
