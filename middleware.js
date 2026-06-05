import { NextResponse } from "next/server"
import { USER_DASHBOARD, WEBSITE_LOGIN } from "./routes/WebsiteRoute"
import { jwtVerify } from "jose"
import { ADMIN_DASHBOARD } from "./routes/AdminPanelRoute"

/**
 * The matcher now runs on every page request (excluding Next internals,
 * API routes, and static files). We use this expanded scope for two
 * reasons:
 *
 *   1) Stamp the request pathname as `x-pathname` on the forwarded
 *      headers so server components — notably `app/not-found.jsx` —
 *      can read which URL the user actually requested.
 *
 *   2) Keep the existing role/auth gating, but only run that branch
 *      for paths under /auth, /admin, /my-account. All other paths
 *      pass through unchanged (the original behavior).
 *
 * Edge-runtime safe: no mongoose, only `jose` for JWT verification
 * and standard fetch primitives.
 */
export async function middleware(request) {
    const pathname = request.nextUrl.pathname

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    const passThrough = () =>
        NextResponse.next({ request: { headers: requestHeaders } })

    const isAuthPath = pathname.startsWith('/auth')
    const isAdminPath = pathname.startsWith('/admin')
    const isUserPath = pathname.startsWith('/my-account')
    const needsAuthCheck = isAuthPath || isAdminPath || isUserPath

    if (!needsAuthCheck) {
        return passThrough()
    }

    try {
        const hasToken = request.cookies.has('access_token')

        if (!hasToken) {
            if (!isAuthPath) {
                return NextResponse.redirect(new URL(WEBSITE_LOGIN, request.nextUrl))
            }
            return passThrough()
        }

        const access_token = request.cookies.get('access_token').value
        const { payload } = await jwtVerify(
            access_token,
            new TextEncoder().encode(process.env.SECRET_KEY)
        )
        const role = payload.role

        if (isAuthPath) {
            return NextResponse.redirect(
                new URL(role === 'admin' ? ADMIN_DASHBOARD : USER_DASHBOARD, request.nextUrl)
            )
        }

        if (isAdminPath && role !== 'admin') {
            return NextResponse.redirect(new URL(WEBSITE_LOGIN, request.nextUrl))
        }

        if (isUserPath && role !== 'user') {
            return NextResponse.redirect(new URL(WEBSITE_LOGIN, request.nextUrl))
        }

        return passThrough()
    } catch (error) {
        console.log(error)
        return NextResponse.redirect(new URL(WEBSITE_LOGIN, request.nextUrl))
    }
}


export const config = {
    matcher: [
        // Run on every path except: api routes, Next internal assets,
        // favicon, and common static file extensions in /public.
        '/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf)).*)',
    ],
}
