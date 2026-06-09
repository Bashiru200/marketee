// lib/rateLimit.ts
// In-memory rate limiter for API routes
// For production at scale, replace with Redis (Upstash)

interface RateLimitEntry {
  count:     number
  resetAt:   number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  key:      string   // unique identifier (IP, user ID, email)
  limit:    number   // max requests allowed
  windowMs: number   // time window in milliseconds
}

interface RateLimitResult {
  success:   boolean
  remaining: number
  resetAt:   number
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // First request or window expired — reset
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// Helper — get client IP from request
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// Pre-configured limiters for common use cases
export const LIMITS = {
  // Contact form — 5 submissions per hour per IP
  contact: (ip: string) => rateLimit({
    key:      `contact:${ip}`,
    limit:    5,
    windowMs: 60 * 60 * 1000,
  }),

  // Review submission — 3 reviews per hour per user
  review: (userId: string) => rateLimit({
    key:      `review:${userId}`,
    limit:    3,
    windowMs: 60 * 60 * 1000,
  }),

  // Broadcast email — 2 per hour per admin
  broadcast: (adminId: string) => rateLimit({
    key:      `broadcast:${adminId}`,
    limit:    2,
    windowMs: 60 * 60 * 1000,
  }),

  // Auth attempts — 10 per 15 minutes per IP
  auth: (ip: string) => rateLimit({
    key:      `auth:${ip}`,
    limit:    10,
    windowMs: 15 * 60 * 1000,
  }),

  // Password reset — 3 per hour per IP
  passwordReset: (ip: string) => rateLimit({
    key:      `reset:${ip}`,
    limit:    3,
    windowMs: 60 * 60 * 1000,
  }),

  // Search API — 60 per minute per IP
  search: (ip: string) => rateLimit({
    key:      `search:${ip}`,
    limit:    60,
    windowMs: 60 * 1000,
  }),
}

// Helper — standard rate limit response
export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return new Response(
    JSON.stringify({
      error:       'Too many requests',
      message:     `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status:  429,
      headers: {
        'Content-Type':  'application/json',
        'Retry-After':   String(retryAfter),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    }
  )
}