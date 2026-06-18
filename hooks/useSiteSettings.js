'use client'
import { useEffect, useState } from 'react'
import axios from '@/lib/apiClient'
import { SITE_SETTINGS_DEFAULTS } from '@/lib/siteSettingsDefaults'

/**
 * Site-settings client hook with SWR-style revalidation.
 *
 * Caching strategy:
 *
 *   1. Module-level cache, one entry per browser tab. All consumers
 *      (Header, Footer, CartBar, etc.) share a single in-flight fetch.
 *
 *   2. Short staleness threshold (30s). Reads within that window return
 *      the cached value; reads after refetch in the background.
 *
 *   3. Revalidate on window focus AND tab visibility change. When the
 *      user switches back to the storefront tab from anywhere else,
 *      we silently refetch — picks up admin saves made in another tab.
 *
 *   4. Cross-tab BroadcastChannel. When admin saves in one tab, every
 *      other tab listening on the channel refetches immediately — no
 *      need to even focus the storefront tab.
 *
 *   5. Cache-busting query param (`_t=<timestamp>`) — defeats any
 *      browser/CDN HTTP caching that might short-circuit our request.
 *
 * Until the first fetch resolves, consumers get the static defaults
 * so UIs never flash blank on first render.
 */
let _cache = null
let _cacheAt = 0
let _inflight = null
const STALE_THRESHOLD = 30 * 1000   // ms
const _listeners = new Set()
const CHANNEL_NAME = 'site-settings-updates'
let _bc = null

const getChannel = () => {
    if (typeof window === 'undefined') return null
    if (_bc) return _bc
    if (typeof BroadcastChannel === 'undefined') return null
    try {
        _bc = new BroadcastChannel(CHANNEL_NAME)
        _bc.addEventListener('message', (e) => {
            if (e?.data?.type === 'invalidate') loadSettings(true)
        })
    } catch {
        _bc = null
    }
    return _bc
}

const broadcast = (value) => {
    _cache = value
    _cacheAt = Date.now()
    _listeners.forEach((set) => set(value))
}

const isStale = () => !_cache || (Date.now() - _cacheAt) > STALE_THRESHOLD

const loadSettings = (force = false) => {
    if (_inflight) return _inflight
    if (!force && !isStale()) return Promise.resolve(_cache)

    _inflight = axios.get('/api/settings', {
        params: { _t: Date.now() },       // cache-bust
        headers: { 'Cache-Control': 'no-cache' },
    })
        .then(({ data }) => {
            if (data?.success && data.data) broadcast(data.data)
            return _cache
        })
        .catch(() => null)
        .finally(() => { _inflight = null })

    return _inflight
}

/**
 * Force a fresh fetch AND notify every other tab on the same origin
 * that they should refetch too. Call this from the admin save flow.
 */
export const refreshSiteSettings = () => {
    const channel = getChannel()
    if (channel) {
        try { channel.postMessage({ type: 'invalidate', at: Date.now() }) } catch { /* ignore */ }
    }
    return loadSettings(true)
}

/** React hook: returns merged settings, falling back to defaults until fetched. */
export const useSiteSettings = () => {
    const [settings, setSettings] = useState(_cache || SITE_SETTINGS_DEFAULTS)

    useEffect(() => {
        _listeners.add(setSettings)

        // Ensure the cross-tab channel is wired before anything else.
        getChannel()

        // Initial fetch (uses cache if fresh).
        loadSettings()

        // Revalidate when the user returns to the tab — picks up changes
        // made in another tab without needing a full reload.
        const onFocus = () => loadSettings()
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') loadSettings()
        }
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            _listeners.delete(setSettings)
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    return settings
}
