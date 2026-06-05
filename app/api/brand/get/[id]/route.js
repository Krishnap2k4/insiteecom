import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import BrandModel from '@/models/Brand.model'
// Side-effect import: registers the Media schema before populate('logo').
import '@/models/Media.model'
import { isValidObjectId } from 'mongoose'

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid brand id.')
        }

        await connectDB()
        const brand = await BrandModel
            .findOne({ _id: id, deletedAt: null })
            .populate('logo', '_id secure_url')
            .lean()

        if (!brand) return response(false, 404, 'Brand not found.')
        return response(true, 200, 'Brand fetched.', brand)
    } catch (error) {
        return catchError(error)
    }
}
