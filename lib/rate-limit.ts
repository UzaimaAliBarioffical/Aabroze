/**
 * Rate Limiter — In-memory implementation for serverless/edge.
 * For production at scale, replace with Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  })
}, 60_000) // every minute

interface RateLimitOptions {
  /** Max requests in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Simple sliding window rate limiter.
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowSeconds } = options
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const existing = store.get(identifier)

  if (!existing || now > existing.resetAt) {
    // New window
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Get client IP from Next.js request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}

/** Rate limit configs for common endpoints */
export const RATE_LIMITS = {
  newsletter: { limit: 3, windowSeconds: 3600 }, // 3 per hour
  contact: { limit: 5, windowSeconds: 3600 }, // 5 per hour
  checkout: { limit: 10, windowSeconds: 3600 }, // 10 per hour
  adminLogin: { limit: 10, windowSeconds: 900 }, // 10 per 15 min
} as const
