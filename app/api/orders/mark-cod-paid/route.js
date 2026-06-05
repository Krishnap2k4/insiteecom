import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { transitionOrderStatus } from '@/lib/orders'
import { sendCodCollected } from '@/lib/orderEmails'
import { ensureInvoiceForOrder } from '@/lib/invoices'
import OrderModel from '@/models/Order.model'
import PaymentModel from '@/models/Payment.model'
import { z } from 'zod'

const bodySchema = z.object({
    orderId: z.string().min(8),
    note: z.string().optional().default(''),
})

/**
 * Admin records that cash for a COD order has been collected on
 * delivery. Flips the order's Payment row from `created` → `captured`
 * and the order's `paymentStatus` from `pending` → `paid`.
 */
export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { orderId, note } = parsed.data

        const order = await OrderModel.findById(orderId)
        if (!order) return response(false, 404, 'Order not found.')
        if (order.paymentMethod !== 'cod') {
            return response(false, 400, 'Only COD orders can be marked as cash-collected.')
        }
        if (order.paymentStatus === 'paid') {
            return response(false, 400, 'Order is already marked as paid.')
        }

        const payment = await PaymentModel
            .findOne({ order: order._id, gateway: 'cod', deletedAt: null })
            .sort({ createdAt: -1 })
        if (payment) {
            payment.status = 'captured'
            payment.capturedAt = new Date()
            await payment.save()
        }

        await transitionOrderStatus({
            orderId: order._id,
            paymentStatus: 'paid',
            note: note || 'Cash collected on delivery',
            actor: auth.userId,
            actorRole: 'admin',
        })

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'order.cod_collected',
            entity: 'Order',
            entityId: order._id,
            meta: { paymentId: payment ? String(payment._id) : null },
        })

        const fresh = await OrderModel.findById(order._id).lean()
        if (fresh) {
            await ensureInvoiceForOrder(fresh)
            sendCodCollected(fresh)
        }

        return response(true, 200, 'Marked as paid.', {
            paymentStatus: 'paid',
        })
    } catch (error) {
        return catchError(error)
    }
}
