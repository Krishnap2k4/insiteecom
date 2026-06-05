import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { RATE_LIMITS, rateLimit } from '@/lib/rateLimit'
import WishlistItemModel from '@/models/WishlistItem.model'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
// Side-effect import: registers the Media schema for the populate('media') chain below.
import '@/models/Media.model'
import { z } from 'zod'
import { isValidObjectId } from 'mongoose'

const addSchema = z.object({
    productId: z.string().refine(isValidObjectId, 'Invalid productId.'),
    variantId: z.string().refine(isValidObjectId, 'Invalid variantId.').nullable().optional(),
})

export async function GET() {
    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized.')
        }
        await connectDB()

        const items = await WishlistItemModel
            .find({ user: auth.userId })
            .sort({ addedAt: -1 })
            .populate({
                path: 'product',
                select: 'name slug mrp sellingPrice discountPercentage media',
                populate: { path: 'media', select: 'secure_url' },
            })
            .populate({
                path: 'variant',
                select: 'color size sku mrp sellingPrice media',
                populate: { path: 'media', select: 'secure_url' },
            })
            .lean()

        return response(true, 200, 'Wishlist fetched.', items)
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    const limited = rateLimit(request, { name: 'account.wishlist.add', ...RATE_LIMITS.AUTH_BURST })
    if (limited) return limited

    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized.')
        }
        await connectDB()

        const payload = await request.json()
        const validate = addSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const { productId, variantId } = validate.data

        const product = await ProductModel.findOne({ _id: productId, deletedAt: null }).lean()
        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        if (variantId) {
            const variant = await ProductVariantModel.findOne({
                _id: variantId,
                product: productId,
                deletedAt: null,
            }).lean()
            if (!variant) {
                return response(false, 404, 'Variant not found.')
            }
        }

        // Compound unique index handles duplicates — catch the conflict
        // and respond gracefully instead of bubbling a 409 to the user.
        try {
            const created = await WishlistItemModel.create({
                user: auth.userId,
                product: productId,
                variant: variantId || null,
            })
            return response(true, 201, 'Added to wishlist.', created.toObject())
        } catch (err) {
            if (err?.code === 11000) {
                return response(true, 200, 'Already in your wishlist.')
            }
            throw err
        }
    } catch (error) {
        return catchError(error)
    }
}
