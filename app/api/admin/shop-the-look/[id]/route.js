import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ShopTheLookModel from '@/models/ShopTheLook.model'
import '@/models/Media.model'
import '@/models/Product.model'

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params

        const item = await ShopTheLookModel
            .findOne({ _id: id, deletedAt: null })
            .populate('thumbnail', '_id secure_url')
            .populate('product', '_id name slug publicId')
            .lean()

        if (!item) return response(false, 404, 'Item not found.')
        return response(true, 200, 'Item fetched.', item)
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const body = await request.json()
        const { title, description, videoUrl, thumbnail, product, sortOrder, isActive } = body

        if (!title?.trim()) return response(false, 400, 'Title is required.')
        if (!videoUrl?.trim()) return response(false, 400, 'Video URL is required.')

        const item = await ShopTheLookModel.findOne({ _id: id, deletedAt: null })
        if (!item) return response(false, 404, 'Item not found.')

        item.title = title.trim()
        item.description = description?.trim() || ''
        item.videoUrl = videoUrl.trim()
        item.thumbnail = thumbnail || null
        item.product = product || null
        item.sortOrder = Number(sortOrder) || 0
        item.isActive = isActive !== false
        await item.save()

        return response(true, 200, 'Item updated.')
    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params

        const item = await ShopTheLookModel.findOne({ _id: id, deletedAt: null })
        if (!item) return response(false, 404, 'Item not found.')

        await item.softDelete()
        return response(true, 200, 'Item deleted.')
    } catch (error) {
        return catchError(error)
    }
}
