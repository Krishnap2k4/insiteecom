import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ShopTheLookModel from '@/models/ShopTheLook.model'
import '@/models/Media.model'
import '@/models/Product.model'

export async function GET() {
    try {
        await connectDB()

        const items = await ShopTheLookModel
            .find({ deletedAt: null, isActive: true })
            .sort({ sortOrder: 1, createdAt: -1 })
            .populate('thumbnail', 'secure_url')
            .populate('product', '_id name slug publicId sellingPrice mrp')
            .lean()

        return response(true, 200, 'Shop the look items fetched.', items)
    } catch (error) {
        return catchError(error)
    }
}
