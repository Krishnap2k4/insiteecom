import { connectDB } from '@/lib/databaseConnection'
import BrandModel from '@/models/Brand.model'
import ProductModel from '@/models/Product.model'
// Import as a named value so we can pass it explicitly to .populate(),
// bypassing Mongoose's string registry (which can be stale after HMR).
import MediaModel from '@/models/Media.model'

/**
 * Brand-landing data fetch — pure function, no HTTP.
 *
 * Used by both the public API route `/api/brand/by-slug/[slug]` and the
 * server page `/b/[slug]`. Returning `{ ok, data | message }` lets the
 * caller decide what to render / what status to set.
 */
export const getBrandBySlug = async (slug) => {
    if (!slug) return { ok: false, status: 404, message: 'Brand not found.' }

    try {
        await connectDB()

        const brand = await BrandModel
            .findOne({ slug, isActive: true, deletedAt: null })
            .populate({ path: 'logo', select: '_id secure_url', model: MediaModel })
            .lean()

        if (!brand) return { ok: false, status: 404, message: 'Brand not found.' }

        const products = await ProductModel
            .find({
                brand: brand._id,
                deletedAt: null,
                status: { $in: ['published', null, undefined] },
            })
            .sort({ salesCount: -1, createdAt: -1 })
            .populate({ path: 'media', select: 'secure_url', model: MediaModel })
            .select('_id name slug publicId mrp sellingPrice discountPercentage media shortDescription')
            .lean()

        // Force ObjectIds → strings, Dates → ISO strings so the result
        // is safe to pass into Client Components from a Server Component.
        return { ok: true, data: JSON.parse(JSON.stringify({ brand, products })) }
    } catch (error) {
        console.error('[getBrandBySlug] threw for slug=', slug, '—', error?.message || error)
        if (process.env.NODE_ENV !== 'production') console.error(error?.stack || error)
        return { ok: false, status: 500, message: error?.message || 'Internal server error.' }
    }
}
