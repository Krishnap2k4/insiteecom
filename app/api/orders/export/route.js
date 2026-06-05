import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { isAuthenticated } from '@/lib/authentication'
import OrderModel from '@/models/Order.model'

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const orders = await OrderModel
            .find({ deletedAt: null })
            .select('orderNumber order_id email totalAmount currency paymentStatus fulfillmentStatus status shippingAddress name phone createdAt')
            .sort({ createdAt: -1 })
            .lean()

        const rows = orders.map((o) => ({
            orderNumber: o.orderNumber || '',
            legacyOrderId: o.order_id || '',
            email: o.email || '',
            fullName: o?.shippingAddress?.fullName || o.name || '',
            phone: o?.shippingAddress?.phone || o.phone || '',
            totalAmount: o.totalAmount,
            currency: o.currency || 'INR',
            paymentStatus: o.paymentStatus,
            fulfillmentStatus: o.fulfillmentStatus,
            legacyStatus: o.status,
            createdAt: o.createdAt,
        }))

        return response(true, 200, 'Data found.', rows)
    } catch (error) {
        return catchError(error)
    }
}
