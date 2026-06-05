import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { logger } from '@/lib/logger'
import { recordAudit } from '@/lib/audit'
import { transitionOrderStatus } from '@/lib/orders'
import { sendRefundProcessed } from '@/lib/orderEmails'
import OrderModel from '@/models/Order.model'
import PaymentModel from '@/models/Payment.model'
import RefundModel from '@/models/Refund.model'
import ReturnModel from '@/models/Return.model'
import Razorpay from 'razorpay'
import { z } from 'zod'

const bodySchema = z.object({
    amount: z.number().positive(),
    reason: z.string().optional().default(''),
})

/**
 * Issue the refund for an approved + received return. Razorpay
 * payments hit the gateway; COD / manual payments record the row
 * as processed immediately. Either way the Return moves to
 * `refunded` and the Order's paymentStatus reconciles.
 */
export async function POST(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { amount, reason } = parsed.data

        const ret = await ReturnModel.findById(id)
        if (!ret) return response(false, 404, 'Return not found.')
        if (ret.status !== 'received') {
            return response(false, 400, `Refund can only be issued after the return is received (currently ${ret.status}).`)
        }
        if (ret.type !== 'return') {
            return response(false, 400, 'For an exchange, create a replacement shipment instead.')
        }

        const order = await OrderModel.findById(ret.order)
        if (!order) return response(false, 404, 'Order not found.')

        const payment = await PaymentModel
            .findOne({ order: order._id, status: { $in: ['captured', 'partially_refunded'] }, deletedAt: null })
            .sort({ createdAt: -1 })
        if (!payment) return response(false, 400, 'No captured payment found on this order.')

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
                    notes: { reason, order_id: String(order._id), return_id: String(ret._id) },
                })
                gatewayRefundId = refund?.id || null
            } catch (err) {
                logger.error('razorpay refund call failed', { returnId: String(ret._id), error: err?.message })
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
            reason: reason || `Return ${ret.returnNumber}`,
            initiatedBy: auth.userId,
            processedAt: refundStatus === 'processed' ? new Date() : null,
        })

        const projectedTotal = refundedSoFar + amount
        const nextPaymentStatus = projectedTotal >= order.totalAmount ? 'refunded' : 'partially_refunded'

        if (!isGateway) {
            payment.status = nextPaymentStatus === 'refunded' ? 'refunded' : 'partially_refunded'
            await payment.save()
        }

        await transitionOrderStatus({
            orderId: order._id,
            paymentStatus: nextPaymentStatus,
            note: `Refund issued for return ${ret.returnNumber} (${amount} ${payment.currency})`,
            actor: auth.userId,
            actorRole: 'admin',
        })

        ret.status = 'refunded'
        ret.refund = refundRow._id
        ret.completedAt = new Date()
        await ret.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'return.refunded',
            entity: 'Return', entityId: ret._id,
            meta: { refundId: String(refundRow._id), amount },
        })

        if (!isGateway) {
            const fresh = await OrderModel.findById(order._id).lean()
            if (fresh) sendRefundProcessed(fresh, refundRow.toObject())
        }

        return response(true, 200, isGateway ? 'Refund initiated.' : 'Refund processed.', {
            refundId: String(refundRow._id),
            gatewayRefundId,
            returnStatus: ret.status,
        })
    } catch (error) {
        return catchError(error)
    }
}
