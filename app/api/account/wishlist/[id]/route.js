import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import WishlistItemModel from '@/models/WishlistItem.model'
import { isValidObjectId } from 'mongoose'

export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized.')
        }

        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid wishlist item id.')
        }

        await connectDB()

        const result = await WishlistItemModel.deleteOne({
            _id: id,
            user: auth.userId,
        })

        if (result.deletedCount === 0) {
            return response(false, 404, 'Wishlist item not found.')
        }

        return response(true, 200, 'Removed from wishlist.')
    } catch (error) {
        return catchError(error)
    }
}
