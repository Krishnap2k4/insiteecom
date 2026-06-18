import { connectDB } from './databaseConnection'
import SettingsModel from '@/models/Settings.model'
import { SITE_SETTINGS_DEFAULTS } from './siteSettingsDefaults'

export { SITE_SETTINGS_DEFAULTS }

/** Shallow-merge each top-level section with its defaults, so partial DB rows hydrate cleanly. */
const mergeWithDefaults = (doc) => {
    const out = {}
    for (const key of Object.keys(SITE_SETTINGS_DEFAULTS)) {
        const def = SITE_SETTINGS_DEFAULTS[key]
        const got = doc?.[key]
        if (!got) { out[key] = def; continue }

        if (key === 'sections') {
            out.sections = {
                testimonials: { ...def.testimonials, ...(got.testimonials || {}) },
                followUs:     { ...def.followUs,     ...(got.followUs     || {}) },
            }
        } else {
            out[key] = { ...def, ...got }
        }
    }
    return out
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Module-level in-process cache (5-min TTL).                              */
/*                                                                          */
/*  Plain JS — no Next.js cache APIs involved, so behaviour is identical    */
/*  across dev, production and edge runtimes. invalidateSettingsCache() is  */
/*  called from the admin save handler; route-level and page-level cache    */
/*  invalidation is handled separately via revalidatePath() on save.        */
/* ──────────────────────────────────────────────────────────────────────── */
let _cache = null
let _cacheAt = 0
// Sub-request perf optimization. Within a single Node process the cache
// is invalidated synchronously on admin save via invalidateSettingsCache(),
// so the TTL only matters as a defensive ceiling when an admin save in
// one process never reaches another (multi-instance prod). 5 min is a
// reasonable upper bound; freshness across processes is bounded by the
// 60s ISR window on the storefront layout anyway.
const CACHE_TTL = 5 * 60 * 1000

export const invalidateSettingsCache = () => {
    _cache = null
    _cacheAt = 0
}

/**
 * Returns the merged + normalised settings, served from the in-process cache
 * when warm. Safe to call from server components, route handlers, or server
 * actions. One cache entry per Node process.
 */
export const getSiteSettings = async () => {
    const now = Date.now()
    if (_cache && now - _cacheAt < CACHE_TTL) return _cache

    await connectDB()
    const doc = await SettingsModel.findOne({ key: 'global' }).lean()
    _cache = mergeWithDefaults(doc)
    _cacheAt = now
    return _cache
}

/** Convenience shortcut used by cart/payment routes. */
export const getShippingSettings = async () => {
    const s = await getSiteSettings()
    return s.shipping
}

/** Back-compat alias. */
export const getSettings = getSiteSettings
