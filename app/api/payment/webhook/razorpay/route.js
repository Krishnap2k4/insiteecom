import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/databaseConnection'
import { logger } from '@/lib/logger'
import { recordAudit } from '@/lib/audit'
import { transitionOrderStatus, recordOrderStatus } from '@/lib/orders'
import { sendRefundProcessed, sendOrderCancelled } from '@/lib/orderEmails'
import { ensureInvoiceForOrder } from '@/lib/invoices'
import OrderModel from '@/models/Order.model'
import PaymentModel from '@/models/Payment.model'
import RefundModel from '@/models/Refund.model'

export const runtime = 'nodejs'

/**
 * Razorpay signs the raw request body with HMAC-SHA256 keyed by the
 * webhook secret. The signature lives in `x-razorpay-signature`.
 * Verification must be done against the EXACT raw bytes — never
 * parse-then-stringify, since JSON re-serialization breaks equality.
 *
 * Configure on the Razorpay dashboard:
 *   URL:    <NEXT_PUBLIC_BASE_URL>/api/payment/webhook/razorpay
 *   Events: payment.captured, payment.failed, order.paid, refund.processed,
 *           refund.failed
 *   Secret: store as RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(request) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
        logger.error('razorpay webhook secret not configured')
        return NextResponse.json({ success: false, message: 'Webhook not configured' }, { status: 500 })
    }

    const signature = request.headers.get('x-razorpay-signature')
    if (!signature) {
        logger.warn('razorpay webhook missing signature header')
        return NextResponse.json({ success: false, message: 'Missing signature' }, { status: 400 })
    }

    const rawBody = await request.text()
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const sigBuf = Buffer.from(signature, 'utf8')
    const expBuf = Buffer.from(expected, 'utf8')
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)
    if (!valid) {
        logger.warn('razorpay webhook signature mismatch')
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
    }

    let event
    try {
        event = JSON.parse(rawBody)
    } catch (err) {
        logger.warn('razorpay webhook invalid json', { error: err })
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    }

    try {
        await connectDB()
        await handleEvent(event)
    } catch (err) {
        logger.error('razorpay webhook handler failed', { event: event?.event, error: err })
        // Always ack so Razorpay doesn't retry-storm on a transient blip;
        // failures land in the error log for manual replay.
        return NextResponse.json({ success: true, received: true }, { status: 200 })
    }

    return NextResponse.json({ success: true, received: true }, { status: 200 })
}

const findOrderByRazorpayOrderId = async (razorpayOrderId) => {
    // First try the legacy `order_id` field, then the structured
    // Payment row reference (new orders).
    let order = await OrderModel.findOne({ order_id: razorpayOrderId })
    if (order) return order
    const payment = await PaymentModel.findOne({ gatewayOrderId: razorpayOrderId })
    if (payment) order = await OrderModel.findById(payment.order)
    return order
}

const handleEvent = async (event) => {
    const eventName = event?.event
    const payment = event?.payload?.payment?.entity
    const refund = event?.payload?.refund?.entity
    const razorpayOrderEntity = event?.payload?.order?.entity
    const razorpayOrderId = payment?.order_id || razorpayOrderEntity?.id || refund?.notes?.order_id

    logger.info('razorpay webhook received', {
        event: eventName,
        razorpayOrderId,
        paymentId: payment?.id,
        refundId: refund?.id,
    })

    if (!razorpayOrderId && !refund) return

    switch (eventName) {
        case 'payment.captured':
        case 'order.paid': {
            const order = await findOrderByRazorpayOrderId(razorpayOrderId)
            if (!order) {
                logger.warn('webhook: order not found', { razorpayOrderId })
                return
            }
            await PaymentModel.updateOne(
                { gatewayPaymentId: payment.id },
                {
                    $set: {
                        order: order._id,
                        gateway: 'razorpay',
                        gatewayOrderId: razorpayOrderId,
                        gatewayPaymentId: payment.id,
                        amount: (payment.amount || 0) / 100,
                        currency: payment.currency || 'INR',
                        method: payment.method || null,
                        status: 'captured',
                        capturedAt: new Date(),
                        rawResponse: payment,
                    },
                },
                { upsert: true }
            )
            await transitionOrderStatus({
                orderId: order._id,
                paymentStatus: 'paid',
                note: 'Razorpay webhook: payment captured',
                actorRole: 'system',
            })
            const captured = await OrderModel.findById(order._id).lean()
            if (captured) await ensureInvoiceForOrder(captured)
            recordAudit({
                actorRole: 'system',
                action: 'order.payment_captured',
                entity: 'Order',
                entityId: order._id,
                meta: { razorpayOrderId, paymentId: payment?.id },
            })
            return
        }

        case 'payment.failed': {
            const order = await findOrderByRazorpayOrderId(razorpayOrderId)
            if (!order) return
            await PaymentModel.updateOne(
                { gatewayPaymentId: payment.id },
                {
                    $set: {
                        order: order._id,
                        gateway: 'razorpay',
                        gatewayOrderId: razorpayOrderId,
                        gatewayPaymentId: payment.id,
                        amount: (payment.amount || 0) / 100,
                        currency: payment.currency || 'INR',
                        method: payment.method || null,
                        status: 'failed',
                        failureReason: payment.error_description || payment.error_code || 'unknown',
                        rawResponse: payment,
                    },
                },
                { upsert: true }
            )
            await transitionOrderStatus({
                orderId: order._id,
                paymentStatus: 'failed',
                fulfillmentStatus: 'cancelled',
                note: `Payment failed: ${payment?.error_description || payment?.error_code || 'unknown'}`,
                actorRole: 'system',
            })
            recordAudit({
                actorRole: 'system',
                action: 'order.payment_failed',
                entity: 'Order',
                entityId: order._id,
                meta: { razorpayOrderId, paymentId: payment?.id, errorCode: payment?.error_code },
            })
            const cancelled = await OrderModel.findById(order._id).lean()
            if (cancelled) sendOrderCancelled(cancelled, payment?.error_description || 'Payment failed')
            return
        }

        case 'refund.processed':
        case 'refund.failed': {
            const targetPayment = await PaymentModel.findOne({ gatewayPaymentId: refund?.payment_id })
            if (!targetPayment) {
                logger.warn('webhook: refund payment not found', { paymentId: refund?.payment_id })
                return
            }
            const status = eventName === 'refund.processed' ? 'processed' : 'failed'
            await RefundModel.updateOne(
                { gatewayRefundId: refund.id },
                {
                    $set: {
                        order: targetPayment.order,
                        payment: targetPayment._id,
                        gatewayRefundId: refund.id,
                        amount: (refund.amount || 0) / 100,
                        currency: refund.currency || 'INR',
                        status,
                        processedAt: status === 'processed' ? new Date() : null,
                        rawResponse: refund,
                    },
                },
                { upsert: true }
            )

            if (status === 'processed') {
                // If the full amount is refunded → 'refunded', else 'partially_refunded'.
                const order = await OrderModel.findById(targetPayment.order)
                if (order) {
                    const refundedSoFar = (await RefundModel.aggregate([
                        { $match: { order: order._id, status: 'processed', deletedAt: null } },
                        { $group: { _id: null, total: { $sum: '$amount' } } },
                    ]))[0]?.total || 0
                    const nextStatus = refundedSoFar >= order.totalAmount
                        ? 'refunded'
                        : 'partially_refunded'
                    await PaymentModel.updateOne(
                        { _id: targetPayment._id },
                        { $set: { status: nextStatus === 'refunded' ? 'refunded' : 'partially_refunded' } }
                    )
                    await transitionOrderStatus({
                        orderId: order._id,
                        paymentStatus: nextStatus,
                        note: `Refund processed via webhook (${refund.id})`,
                        actorRole: 'system',
                    })
                    const updated = await OrderModel.findById(order._id).lean()
                    const refundDoc = await RefundModel.findOne({ gatewayRefundId: refund.id }).lean()
                    if (updated && refundDoc) sendRefundProcessed(updated, refundDoc)
                }
            } else {
                await recordOrderStatus({
                    order: targetPayment.order,
                    statusType: 'payment',
                    toStatus: 'refund_failed',
                    note: `Refund ${refund.id} failed`,
                    actorRole: 'system',
                })
            }
            recordAudit({
                actorRole: 'system',
                action: `order.refund_${status}`,
                entity: 'Refund',
                meta: { refundId: refund?.id, paymentId: refund?.payment_id },
            })
            return
        }

        default:
            return
    }
}
