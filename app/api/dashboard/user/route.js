import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import OrderModel from '@/models/Order.model'

export async function GET() {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized')

        const userId = auth.userId
        const recentOrders = await OrderModel
            .find({ user: userId, deletedAt: null })
            .select('orderNumber order_id totalAmount currency paymentStatus fulfillmentStatus status items createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()

        const totalOrder = await OrderModel.countDocuments({ user: userId, deletedAt: null })

        const cleaned = recentOrders.map((o) => ({
            _id: String(o._id),
            orderNumber: o.orderNumber || o.order_id || String(o._id),
            totalAmount: o.totalAmount,
            currency: o.currency || 'INR',
            paymentStatus: o.paymentStatus || 'pending',
            fulfillmentStatus: o.fulfillmentStatus || 'unfulfilled',
            status: o.status,
            itemCount: Array.isArray(o.items) ? o.items.length : 0,
            createdAt: o.createdAt,
        }))

        return response(true, 200, 'Dashboard info.', { recentOrders: cleaned, totalOrder })
    } catch (error) {
        return catchError(error)
    }
}
