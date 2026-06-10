import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ShopTheLookModel from '@/models/ShopTheLook.model'
import '@/models/Media.model'
import '@/models/Product.model'

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()

        const items = await ShopTheLookModel
            .find({ deletedAt: null })
            .sort({ sortOrder: 1, createdAt: -1 })
            .populate('thumbnail', 'secure_url')
            .populate('product', '_id name slug publicId')
            .lean()

        return response(true, 200, 'Items fetched.', items)
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()

        const body = await request.json()
        const { title, description, videoUrl, thumbnail, product, sortOrder, isActive } = body

        if (!title?.trim()) return response(false, 400, 'Title is required.')
        if (!videoUrl?.trim()) return response(false, 400, 'Video URL is required.')

        const item = await ShopTheLookModel.create({
            title: title.trim(),
            description: description?.trim() || '',
            videoUrl: videoUrl.trim(),
            thumbnail: thumbnail || null,
            product: product || null,
            sortOrder: Number(sortOrder) || 0,
            isActive: isActive !== false,
        })

        return response(true, 201, 'Item created.', { _id: item._id })
    } catch (error) {
        return catchError(error)
    }
}
