import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ReturnModel from '@/models/Return.model'

/**
 * GET /api/account/returns/[id] — fetch one return owned by this user.
 * The id can be the Mongo _id or the human-friendly returnNumber.
 */
export async function GET(_request, { params }) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const { id } = await params
        const or = [{ returnNumber: String(id).toUpperCase() }]
        if (/^[0-9a-fA-F]{24}$/.test(id)) or.push({ _id: id })

        const doc = await ReturnModel
            .findOne({ $or: or, user: auth.userId, deletedAt: null })
            .populate({ path: 'order', select: 'orderNumber totalAmount currency shippingAddress paymentMethod paymentStatus fulfillmentStatus items createdAt' })
            .lean()
        if (!doc) return response(false, 404, 'Return not found.')

        return response(true, 200, 'Return found.', doc)
    } catch (error) {
        return catchError(error)
    }
}
