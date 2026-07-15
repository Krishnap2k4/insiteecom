import { headers } from 'next/headers'

/**
 * Build an absolute URL to *our own* /api routes that's safe to use
 * from a Server Component fetch.
 *
 * Priority:
 *   1. `process.env.NEXT_PUBLIC_API_BASE_URL` (e.g. https://example.com/api)
 *      — explicit override if you ever need it.
 *   2. Derived from the incoming request's `host` / `x-forwarded-host`
 *      + `x-forwarded-proto` headers. This is the production-safe path:
 *      whatever URL the visitor hit *is* the URL the API lives at.
 *
 * This eliminates the production-only failure mode where a missing
 * `NEXT_PUBLIC_API_BASE_URL` produced `undefined/product/details/foo`,
 * crashing the server component and triggering the error boundary.
 *
 * Returns the base WITHOUT a trailing slash, so callers can build paths
 * with plain template strings: `${base}/product/details/${slug}`.
 */
export const getApiBaseUrl = async () => {
    const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
    if (fromEnv) return fromEnv.replace(/\/+$/, '')

    try {
        const h = await headers()
        const host = h.get('x-forwarded-host') || h.get('host')
        if (!host) return ''

        const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
        return `${proto}://${host}/api`
    } catch {
        // headers() is unavailable outside a request scope (rare during
        // build-time prerender). Return empty so callers can fall back
        // to a relative fetch from the browser.
        return ''
    }
}
