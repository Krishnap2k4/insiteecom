import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import OrderModel from '@/models/Order.model'
import ReturnModel from '@/models/Return.model'
import InvoiceModel from '@/models/Invoice.model'

/**
 * Storefront /account/orders list. Returns a compact view (no item
 * arrays) — the detail page hits /api/orders/get/[orderid] on click.
 *
 * For each order we also include `hasActiveReturn` so the list can
 * show a "Return in progress" badge without an extra round-trip per
 * row.
 */
export async function GET() {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized')

        const orders = await OrderModel
            .find({ user: auth.userId, deletedAt: null })
            .select('orderNumber order_id totalAmount currency paymentStatus fulfillmentStatus status items createdAt')
            .sort({ createdAt: -1 })
            .lean()

        const orderIds = orders.map((o) => o._id)

        // Parallel side-loads for the per-row badges. We bucket by
        // order id so each row lookup is O(1).
        const [returnsForUser, invoicesForUser] = await Promise.all([
            ReturnModel
                .find({
                    user: auth.userId,
                    deletedAt: null,
                    status: { $in: ['requested', 'approved', 'received', 'refunded', 'replaced'] },
                })
                .select('order status')
                .lean(),
            InvoiceModel
                .find({ order: { $in: orderIds }, deletedAt: null })
                .select('order')
                .lean(),
        ])

        const ordersWithActiveReturn = new Set(
            returnsForUser
                .filter((r) => ['requested', 'approved', 'received'].includes(r.status))
                .map((r) => String(r.order))
        )
        const ordersWithInvoice = new Set(invoicesForUser.map((i) => String(i.order)))

        const list = orders.map((o) => ({
            _id: String(o._id),
            orderNumber: o.orderNumber || o.order_id || String(o._id),
            totalAmount: o.totalAmount,
            currency: o.currency || 'INR',
            paymentStatus: o.paymentStatus || 'pending',
            fulfillmentStatus: o.fulfillmentStatus || 'unfulfilled',
            status: o.status,
            itemCount: Array.isArray(o.items) ? o.items.length : 0,
            hasActiveReturn: ordersWithActiveReturn.has(String(o._id)),
            hasInvoice: ordersWithInvoice.has(String(o._id)),
            createdAt: o.createdAt,
        }))

        return response(true, 200, 'Order info.', list)
    } catch (error) {
        return catchError(error)
    }
}
