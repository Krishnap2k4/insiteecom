import { catchError, response } from '@/lib/helperFunction'
import { getSiteSettings } from '@/lib/settings'

/**
 * Public, unauthenticated endpoint consumed by client components
 * (Header marquee/logo, FollowUs, Testimonial, CartBar, etc.) via
 * the useSiteSettings hook.
 *
 * Per-request execution — no HTTP-level caching. The hot path is still
 * fast because lib/settings.js has an in-process module cache (30s TTL,
 * invalidated when the admin saves). Explicit no-store headers defeat
 * any intermediate proxy / CDN / browser cache from short-circuiting.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await getSiteSettings()
        const res = response(true, 200, 'Settings fetched.', settings)
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        res.headers.set('Pragma', 'no-cache')
        res.headers.set('Expires', '0')
        return res
    } catch (error) {
        return catchError(error)
    }
}
