import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import BrandModel from '@/models/Brand.model'
import ProductModel from '@/models/Product.model'
// Register populated schemas so .populate() doesn't bail at request time.
import '@/models/Media.model'

/**
 * Public storefront endpoint. Returns the brand together with its
 * published products so `/b/<slug>` can render the landing page
 * server-side in one shot.
 */
export async function GET(request, { params }) {
    try {
        const { slug } = await params
        if (!slug) return response(false, 404, 'Brand not found.')

        await connectDB()

        const brand = await BrandModel
            .findOne({ slug, isActive: true, deletedAt: null })
            .populate('logo', '_id secure_url')
            .lean()

        if (!brand) return response(false, 404, 'Brand not found.')

        const products = await ProductModel
            .find({
                brand: brand._id,
                deletedAt: null,
                status: { $in: ['published', null, undefined] },
            })
            .sort({ salesCount: -1, createdAt: -1 })
            .populate('media', 'secure_url')
            .select('_id name slug publicId mrp sellingPrice discountPercentage media shortDescription')
            .lean()

        return response(true, 200, 'Brand fetched.', { brand, products })
    } catch (error) {
        return catchError(error)
    }
}
