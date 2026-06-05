import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { transitionOrderStatus } from '@/lib/orders'
import { recordAudit } from '@/lib/audit'
import { sendOrderCancelled, sendOrderDelivered } from '@/lib/orderEmails'
import OrderModel from '@/models/Order.model'
import { z } from 'zod'
import { paymentStatus, fulfillmentStatus } from '@/lib/utils'

const bodySchema = z.object({
    _id: z.string().min(8, 'Order id is required.'),
    paymentStatus: z.enum(paymentStatus).optional(),
    fulfillmentStatus: z.enum(fulfillmentStatus).optional(),
    note: z.string().optional().default(''),
})

/**
 * Admin sets the order's payment and/or fulfillment status. Each
 * change is recorded in OrderStatusHistory.
 */
export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { _id, paymentStatus: ps, fulfillmentStatus: fs, note } = parsed.data
        if (!ps && !fs) return response(false, 400, 'Specify a status to update.')

        const order = await transitionOrderStatus({
            orderId: _id,
            paymentStatus: ps,
            fulfillmentStatus: fs,
            note,
            actor: auth.userId,
            actorRole: 'admin',
        })
        if (!order) return response(false, 404, 'Order not found.')

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'order.status_update',
            entity: 'Order',
            entityId: order._id,
            meta: { paymentStatus: ps, fulfillmentStatus: fs, note },
        })

        // Lifecycle emails — only fire when the admin transitions INTO
        // a customer-meaningful state. Skip on payment-only edits.
        if (fs === 'cancelled') {
            const fresh = await OrderModel.findById(order._id).lean()
            if (fresh) sendOrderCancelled(fresh, note)
        } else if (fs === 'fulfilled') {
            const fresh = await OrderModel.findById(order._id).lean()
            if (fresh) sendOrderDelivered(fresh)
        }

        return response(true, 200, 'Order status updated.', {
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            status: order.status,
        })
    } catch (error) {
        return catchError(error)
    }
}
