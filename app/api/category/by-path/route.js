import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { findCategoryByPath } from '@/lib/catalog'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'
import '@/models/Media.model'

/**
 * Resolve a hierarchical category path to:
 *   - the category itself + populated ancestors (breadcrumb)
 *   - its direct child categories (sub-nav on the page)
 *   - published products in this category OR any descendant
 *
 * Called by `/c/[...slug]` server pages.
 *
 *   GET /api/category/by-path?path=men/shirts
 *   GET /api/category/by-path?path=men/shirts&page=2&size=20
 */
export async function GET(request) {
    try {
        await connectDB()
        const path = request.nextUrl.searchParams.get('path') || ''
        const page = Math.max(0, parseInt(request.nextUrl.searchParams.get('page') || '0', 10))
        const size = Math.min(60, Math.max(1, parseInt(request.nextUrl.searchParams.get('size') || '24', 10)))

        const category = await findCategoryByPath(path)
        if (!category) {
            return response(false, 404, 'Category not found.')
        }

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

        // Match products under this category or any descendant by
        // checking both the legacy `category` ref and the new
        // `categories[]` multi-ref.
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
                .skip(page * size)
                .limit(size)
                .populate('media', 'secure_url')
                .select('_id name slug publicId mrp sellingPrice discountPercentage media shortDescription')
                .lean(),
            ProductModel.countDocuments(productFilter),
        ])

        return response(true, 200, 'Category fetched.', {
            category,
            ancestors,
            children,
            products,
            meta: { total, page, size },
        })
    } catch (error) {
        return catchError(error)
    }
}
