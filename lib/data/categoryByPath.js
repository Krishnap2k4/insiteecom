import { connectDB } from '@/lib/databaseConnection'
import { findCategoryByPath } from '@/lib/catalog'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'
// Import as a named value so we can pass it explicitly to .populate(),
// bypassing Mongoose's string registry (which can be stale after HMR).
import MediaModel from '@/models/Media.model'

/**
 * Category-landing data fetch — pure function, no HTTP.
 *
 * Used by both the public API route `/api/category/by-path` and the
 * server page `/c/[...slug]`.
 */
export const getCategoryByPath = async (path, { page = 0, size = 24 } = {}) => {
    try {
        await connectDB()

        const safePage = Math.max(0, parseInt(page, 10) || 0)
        const safeSize = Math.min(60, Math.max(1, parseInt(size, 10) || 24))

        const category = await findCategoryByPath(path || '')
        if (!category) return { ok: false, status: 404, message: 'Category not found.' }

        const [ancestors, children] = await Promise.all([
            CategoryModel
                .find({ _id: { $in: category.ancestors || [] }, deletedAt: null })
                .sort({ depth: 1 })
                .select('_id name slug path')
                .lean(),
            CategoryModel
                .find({ parent: category._id, deletedAt: null, isActive: true })
                .sort({ sortOrder: 1, name: 1 })
                .select('_id name slug path image')
                .lean(),
        ])

        const productFilter = {
            deletedAt: null,
            status: { $in: ['published', null, undefined] },
            $or: [
                { category: category._id },
                { categories: category._id },
            ],
        }

        const [products, total] = await Promise.all([
            ProductModel
                .find(productFilter)
                .sort({ salesCount: -1, createdAt: -1 })
                .skip(safePage * safeSize)
                .limit(safeSize)
                .populate({ path: 'media', select: 'secure_url', model: MediaModel })
                .select('_id name slug publicId mrp sellingPrice discountPercentage media shortDescription')
                .lean(),
            ProductModel.countDocuments(productFilter),
        ])

        // Force ObjectIds → strings, Dates → ISO strings so the result
        // is safe to pass into Client Components from a Server Component.
        return {
            ok: true,
            data: JSON.parse(JSON.stringify({
                category,
                ancestors,
                children,
                products,
                meta: { total, page: safePage, size: safeSize },
            })),
        }
    } catch (error) {
        console.error('[getCategoryByPath] threw for path=', path, '—', error?.message || error)
        if (process.env.NODE_ENV !== 'production') console.error(error?.stack || error)
        return { ok: false, status: 500, message: error?.message || 'Internal server error.' }
    }
}
