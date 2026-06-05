const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

/**
 * robots.txt — instructs crawlers to skip admin / API / auth surfaces
 * and points them at the dynamic sitemap.
 */
export async function GET() {
    const body = `User-agent: *
Disallow: /admin
Disallow: /api
Disallow: /auth
Disallow: /my-account
Disallow: /addresses
Disallow: /wishlist
Disallow: /profile
Disallow: /orders
Disallow: /checkout
Disallow: /cart

Sitemap: ${BASE}/sitemap.xml
`

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}
