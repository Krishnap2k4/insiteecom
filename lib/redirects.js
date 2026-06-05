import RedirectModel from '@/models/Redirect.model'
import { connectDB } from './databaseConnection'
import { logger } from './logger'

/**
 * Look up an active redirect for a given path.
 * Returns { to, statusCode } or null.
 *
 * Wired from `app/not-found.jsx` — if a 404 lookup matches a stored
 * redirect, the page redirects instead of rendering the 404 body.
 *
 * Result (hit or miss) is cached in process memory for CACHE_TTL_MS.
 * Caching misses too keeps a flood of 404s on unknown paths from
 * hammering Mongo. The trade-off is that newly added redirects take
 * up to CACHE_TTL_MS to become active — acceptable for admin-edited
 * data. The cache is per-Node-instance; horizontal scaling will need
 * a shared cache (Redis) but the public API of this helper stays the
 * same when that lands.
 *
 * Hit counters are updated fire-and-forget so the redirect is never
 * blocked on the write.
 */

const CACHE_TTL_MS = 60_000

const globalKey = '__appRedirectCache'
const cache = globalThis[globalKey] || (globalThis[globalKey] = new Map())

const cleanupKey = '__appRedirectCacheCleanup'
if (!globalThis[cleanupKey]) {
    globalThis[cleanupKey] = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of cache) {
            if (entry.expiresAt <= now) cache.delete(key)
        }
    }, 60_000)
    if (globalThis[cleanupKey].unref) globalThis[cleanupKey].unref()
}

const normalizePath = (path) => {
    if (!path) return ''
    return path.toLowerCase()
}

export const findRedirect = async (path) => {
    const key = normalizePath(path)
    if (!key) return null

    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
        if (cached.result) bumpHit(cached.result._id)
        return cached.result ? { to: cached.result.to, statusCode: cached.result.statusCode } : null
    }

    try {
        await connectDB()
        const redirect = await RedirectModel.findOne({
            from: key,
            isActive: true,
            deletedAt: null,
        }).lean()

        cache.set(key, {
            result: redirect || null,
            expiresAt: Date.now() + CACHE_TTL_MS,
        })

        if (!redirect) return null

        bumpHit(redirect._id)
        return { to: redirect.to, statusCode: redirect.statusCode }
    } catch (err) {
        logger.error('redirect lookup failed', { path, error: err })
        return null
    }
}

const bumpHit = (id) => {
    if (!id) return
    RedirectModel.updateOne(
        { _id: id },
        { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } }
    ).catch((err) => logger.warn('redirect hit increment failed', { error: err }))
}

/**
 * Clear the in-process cache. Call after admin add/update/delete on
 * the Redirect collection so the next lookup goes back to Mongo.
 */
export const invalidateRedirectCache = (path) => {
    if (path) {
        cache.delete(normalizePath(path))
    } else {
        cache.clear()
    }
}
