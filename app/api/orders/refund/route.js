import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { logger } from '@/lib/logger'
import { recordAudit } from '@/lib/audit'
import { transitionOrderStatus } from '@/lib/orders'
import { sendRefundProcessed } from '@/lib/orderEmails'
import { emitNotification } from '@/lib/notifications'
import OrderModel from '@/models/Order.model'
import PaymentModel from '@/models/Payment.model'
import RefundModel from '@/models/Refund.model'
import Razorpay from 'razorpay'
import { z } from 'zod'

const bodySchema = z.object({
    orderId: z.string().min(8),
    amount: z.number().positive(),
    reason: z.string().optional().default(''),
})

/**
 * Initiate a refund against the latest captured payment of an order.
 *
 * For Razorpay payments → calls the gateway, creates a `pending`
 * Refund row, and the webhook flips it to `processed` later.
 *
 * For COD / manual payments → records the refund row immediately as
 * `processed` (admin is logging an out-of-band cash refund).
 *
 * Multiple partial refunds supported; their sum cannot exceed the
 * captured amount.
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
        const { orderId, amount, reason } = parsed.data

        const order = await OrderModel.findById(orderId)
        if (!order) return response(false, 404, 'Order not found.')

        const payment = await PaymentModel
            .findOne({ order: order._id, status: { $in: ['captured', 'partially_refunded'] }, deletedAt: null })
            .sort({ createdAt: -1 })
        if (!payment) return response(false, 400, 'No captured payment found for this order.')

        const refundedSoFar = (await RefundModel.aggregate([
            { $match: { order: order._id, status: 'processed', deletedAt: null } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]))[0]?.total || 0
        if (refundedSoFar + amount > payment.amount + 0.001) {
            return response(false, 400, `Cannot refund more than captured (${payment.amount}).`)
        }

        const isGateway = payment.gateway === 'razorpay' && payment.gatewayPaymentId

        let gatewayRefundId = null
        if (isGateway) {
            try {
                if (!process.env.RAZORPAY_KEY_SECRET) {
                    return response(false, 500, 'Refund gateway is not configured.')
                }
                const razInstance = new Razorpay({
                    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                })
                const refund = await razInstance.payments.refund(payment.gatewayPaymentId, {
                    amount: Math.round(amount * 100),
                    notes: { reason, order_id: String(order._id) },
                })
                gatewayRefundId = refund?.id || null
            } catch (err) {
                logger.error('razorpay refund call failed', { orderId: String(order._id), error: err?.message })
                return response(false, 502, `Gateway refund failed: ${err?.message || 'unknown'}`)
            }
        }

        const refundStatus = isGateway ? 'pending' : 'processed'
        const refundRow = await RefundModel.create({
            order: order._id,
            payment: payment._id,
            gatewayRefundId,
            amount,
            currency: payment.currency,
            status: refundStatus,
            reason,
            initiatedBy: auth.userId,
            processedAt: refundStatus === 'processed' ? new Date() : null,
        })

        // For Razorpay we set a tentative paymentStatus here and let the
        // webhook reconcile if the gateway later fails. For COD/manual
        // refunds the row is already terminal so we transition directly
        // and mark the parent payment too.
        const projectedTotal = refundedSoFar + amount
        const nextPaymentStatus = projectedTotal >= order.totalAmount ? 'refunded' : 'partially_refunded'

        if (!isGateway) {
            payment.status = nextPaymentStatus === 'refunded' ? 'refunded' : 'partially_refunded'
            await payment.save()
        }

        await transitionOrderStatus({
            orderId: order._id,
            paymentStatus: nextPaymentStatus,
            note: isGateway
                ? `Refund initiated by admin (${amount} ${payment.currency})`
                : `Manual refund recorded by admin (${amount} ${payment.currency})`,
            actor: auth.userId,
            actorRole: 'admin',
        })

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: isGateway ? 'order.refund_initiated' : 'order.refund_manual',
            entity: 'Refund',
            entityId: refundRow._id,
            meta: { orderId: String(order._id), amount, gatewayRefundId, gateway: payment.gateway },
        })

        // Manual / COD refunds are terminal here — email immediately.
        // Razorpay refunds wait for the webhook to send the email so
        // the customer hears about the actual processed state.
        if (!isGateway) {
            sendRefundProcessed(
                order.toObject ? order.toObject() : order,
                refundRow.toObject ? refundRow.toObject() : refundRow,
            )
            if (order.user) {
                emitNotification({
                    user: order.user,
                    type: 'refund',
                    title: `Refund processed`,
                    body: `Order ${order.orderNumber} — refunded ${amount} ${payment.currency}`,
                    actionUrl: `/order-details/${order.orderNumber}`,
                    entityType: 'Order',
                    entityId: order._id,
                })
            }
        }

        return response(true, 200, isGateway ? 'Refund initiated.' : 'Manual refund recorded.', {
            refundId: String(refundRow._id),
            gatewayRefundId,
            status: refundStatus,
        })
    } catch (error) {
        return catchError(error)
    }
}
