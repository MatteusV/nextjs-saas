type RateLimitParams = {
  key: string
  limit: number
  windowMs: number
}

type RateEntry = {
  count: number
  expiresAt: number
}

const memoryStore = new Map<string, RateEntry>()

export function rateLimit({ key, limit, windowMs }: RateLimitParams) {
  const now = Date.now()
  const existing = memoryStore.get(key)
  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs })
    return true
  }

  if (existing.count >= limit) {
    return false
  }

  existing.count += 1
  return true
}
