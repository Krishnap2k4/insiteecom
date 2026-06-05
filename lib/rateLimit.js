import { NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * In-memory fixed-window rate limiter.
 *
 * Single-instance only — when we scale horizontally, swap the
 * `store` for a Redis-backed implementation. The public API
 * (`rateLimit(...)`) stays identical.
 *
 * Keyed by IP + route name so different endpoints don't share quota.
 */

const globalKey = '__appRateLimitStore'
const store = globalThis[globalKey] || (globalThis[globalKey] = new Map())

// Periodic cleanup of expired entries to keep memory bounded.
const cleanupKey = '__appRateLimitCleanup'
if (!globalThis[cleanupKey]) {
    globalThis[cleanupKey] = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store) {
            if (entry.resetAt <= now) store.delete(key)
        }
    }, 60_000)
    if (globalThis[cleanupKey].unref) globalThis[cleanupKey].unref()
}

const getClientIp = (request) => {
    const xff = request.headers.get('x-forwarded-for')
    if (xff) return xff.split(',')[0].trim()
    const real = request.headers.get('x-real-ip')
    if (real) return real
    return request.ip || 'unknown'
}

/**
 * Check rate limit. Returns null if request is allowed.
 * Returns a NextResponse with 429 if the limit is exceeded —
 * the caller should return it immediately.
 *
 *   const limited = rateLimit(request, { name: 'auth.login', limit: 5, windowMs: 60_000 })
 *   if (limited) return limited
 */
export const rateLimit = (request, { name, limit, windowMs }) => {
    const ip = getClientIp(request)
    const key = `${name}:${ip}`
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs }
        store.set(key, entry)
    }
    entry.count += 1

    const remaining = Math.max(0, limit - entry.count)
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)

    if (entry.count > limit) {
        logger.warn('rate limit exceeded', { name, ip, count: entry.count, limit })
        const res = NextResponse.json(
            {
                success: false,
                statusCode: 429,
                message: 'Too many requests. Please slow down and try again shortly.',
                code: 'TOO_MANY_REQUESTS',
            },
            { status: 429 }
        )
        res.headers.set('Retry-After', String(retryAfterSec))
        res.headers.set('X-RateLimit-Limit', String(limit))
        res.headers.set('X-RateLimit-Remaining', '0')
        res.headers.set('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)))
        return res
    }

    return null
}

// Convenience presets — tweak in one place.
export const RATE_LIMITS = {
    AUTH: { limit: 5, windowMs: 60_000 },        // 5/min per IP
    AUTH_BURST: { limit: 20, windowMs: 60_000 }, // generous for verify-otp polling etc.
    PAYMENT: { limit: 10, windowMs: 60_000 },    // 10/min per IP
}
