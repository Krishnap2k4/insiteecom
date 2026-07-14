/**
 * Return the public site origin for links that leave the app.
 *
 * Order of precedence:
 *   1. The incoming request's forwarded host / proto headers.
 *   2. The request URL origin as a request-scoped fallback.
 *   3. `NEXT_PUBLIC_BASE_URL` when a request is unavailable.
 *   4. Localhost as a last resort for development.
 */
export const getPublicBaseUrl = (request) => {
    const host = request?.headers?.get('x-forwarded-host') || request?.headers?.get('host')
    if (host) {
        const proto = request?.headers?.get('x-forwarded-proto')
            || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
        return `${proto}://${host}`
    }

    const origin = request?.nextUrl?.origin?.trim()
    if (origin) return origin.replace(/\/+$/, '')

    const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim()
    if (fromEnv) return fromEnv.replace(/\/+$/, '')

    return 'http://localhost:3000'
}