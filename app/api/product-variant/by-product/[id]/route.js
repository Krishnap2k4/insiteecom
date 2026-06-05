import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import InventoryModel from '@/models/Inventory.model'
import ProductVariantModel from '@/models/ProductVariant.model'
// Side-effect imports: register schemas for populate calls.
import '@/models/Media.model'
import { isValidObjectId } from 'mongoose'

/**
 * Admin GET — every variant for a given product, with the default
 * warehouse's inventory joined in. Used by the inline variants
 * manager on the product edit page so the admin doesn't have to
 * jump to a separate page just to see what variants exist.
 */
export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid product id.')

        await connectDB()

        const variants = await ProductVariantModel
            .find({ product: id, deletedAt: null })
            .sort({ createdAt: 1 })
            .populate('media', 'secure_url')
            .lean()

        // Pull default-warehouse inventory rows for these variants in
        // one query and stitch them onto the variant objects.
        const variantIds = variants.map((v) => v._id)
        const inventories = await InventoryModel
            .find({
                variant: { $in: variantIds },
                warehouse: 'default',
                deletedAt: null,
            })
            .lean()

        const invByVariant = new Map()
        for (const inv of inventories) {
            invByVariant.set(String(inv.variant), {
                quantity: inv.quantity || 0,
                reserved: inv.reserved || 0,
                available: Math.max(0, (inv.quantity || 0) - (inv.reserved || 0)),
                reorderLevel: inv.reorderLevel || 0,
            })
        }

        const result = variants.map((v) => ({
            ...v,
            inventory: invByVariant.get(String(v._id)) || null,
        }))

        return response(true, 200, 'Variants fetched.', result)
    } catch (error) {
        return catchError(error)
    }
}
