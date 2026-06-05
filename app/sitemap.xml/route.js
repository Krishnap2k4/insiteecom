import { connectDB } from '@/lib/databaseConnection'
import { buildProductSlug } from '@/lib/publicId'
import BrandModel from '@/models/Brand.model'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

const xmlEscape = (s) =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

const formatDate = (d) => (d ? new Date(d).toISOString() : new Date().toISOString())

const urlEntry = ({ loc, lastmod, changefreq, priority }) => {
    const parts = [`<loc>${xmlEscape(loc)}</loc>`]
    if (lastmod) parts.push(`<lastmod>${formatDate(lastmod)}</lastmod>`)
    if (changefreq) parts.push(`<changefreq>${changefreq}</changefreq>`)
    if (priority !== undefined) parts.push(`<priority>${priority}</priority>`)
    return `<url>${parts.join('')}</url>`
}

/**
 * Dynamic sitemap. Includes:
 *   - core static pages
 *   - every active category (canonical hierarchical path)
 *   - every active brand
 *   - every published product (with canonical slug-publicId URL)
 *
 * Cached via Next response headers for 1 hour — sitemaps don't need
 * to update faster than that and search engines respect Cache-Control.
 */
export async function GET() {
    await connectDB()

    const [categories, brands, products] = await Promise.all([
        CategoryModel.find({ deletedAt: null, isActive: true }).select('path updatedAt').lean(),
        BrandModel.find({ deletedAt: null, isActive: true }).select('slug updatedAt').lean(),
        ProductModel
            .find({
                deletedAt: null,
                $or: [{ status: 'published' }, { status: { $exists: false } }, { status: null }],
            })
            .select('slug publicId updatedAt')
            .lean(),
    ])

    const urls = []
    urls.push(urlEntry({ loc: `${BASE}/`, changefreq: 'daily', priority: 1.0 }))
    urls.push(urlEntry({ loc: `${BASE}/shop`, changefreq: 'daily', priority: 0.9 }))
    urls.push(urlEntry({ loc: `${BASE}/about-us`, changefreq: 'monthly', priority: 0.3 }))
    urls.push(urlEntry({ loc: `${BASE}/privacy-policy`, changefreq: 'yearly', priority: 0.2 }))
    urls.push(urlEntry({ loc: `${BASE}/terms-and-conditions`, changefreq: 'yearly', priority: 0.2 }))

    for (const cat of categories) {
        if (!cat.path) continue
        urls.push(urlEntry({
            loc: `${BASE}/c/${cat.path}`,
            lastmod: cat.updatedAt,
            changefreq: 'weekly',
            priority: 0.7,
        }))
    }

    for (const brand of brands) {
        if (!brand.slug) continue
        urls.push(urlEntry({
            loc: `${BASE}/b/${brand.slug}`,
            lastmod: brand.updatedAt,
            changefreq: 'weekly',
            priority: 0.6,
        }))
    }

    for (const p of products) {
        const slugFragment = p.publicId ? buildProductSlug(p.slug, p.publicId) : p.slug
        urls.push(urlEntry({
            loc: `${BASE}/product/${slugFragment}`,
            lastmod: p.updatedAt,
            changefreq: 'weekly',
            priority: 0.8,
        }))
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
        },
    })
}
