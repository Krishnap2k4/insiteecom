import { headers } from 'next/headers'
import { permanentRedirect, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { findRedirect } from '@/lib/redirects'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

/**
 * Global 404. Before rendering the not-found body we consult the
 * Redirect collection — if the requested path matches an active
 * redirect, we issue an HTTP redirect to the configured target.
 *
 * The pathname is read from the `x-pathname` header set by
 * `middleware.js` on every page request.
 *
 * Status code mapping:
 *   301, 308 → permanentRedirect (308 is method-preserving 301)
 *   302, 307 → redirect          (307 is method-preserving 302)
 */
const NotFound = async () => {
    const h = await headers()
    const path = h.get('x-pathname')

    if (path) {
        const match = await findRedirect(path)
        if (match?.to) {
            if (match.statusCode === 301 || match.statusCode === 308) {
                permanentRedirect(match.to)
            }
            redirect(match.to)
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-md text-center">
                <p className="text-7xl font-semibold text-primary mb-2">404</p>
                <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
                <p className="text-gray-500 mb-8">
                    The page you are looking for has been moved or doesn&apos;t exist.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button asChild className="rounded-full px-6">
                        <Link href={WEBSITE_HOME}>Go home</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-6">
                        <Link href={WEBSITE_SHOP}>Browse shop</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default NotFound
