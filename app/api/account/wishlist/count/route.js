import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import WishlistItemModel from '@/models/WishlistItem.model'

/**
 * Lightweight count endpoint for the header heart icon. Returns 0
 * for guests instead of erroring — so the header doesn't have to
 * branch on auth state before calling.
 */
export async function GET() {
    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(true, 200, 'Guest.', { count: 0 })
        }
        await connectDB()
        const count = await WishlistItemModel.countDocuments({ user: auth.userId })
        return response(true, 200, 'Wishlist count.', { count })
    } catch (error) {
        return catchError(error)
    }
}
