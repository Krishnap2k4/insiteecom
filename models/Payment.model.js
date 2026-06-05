import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * One row per payment attempt. An Order can have multiple Payment
 * rows over its lifetime (retry, partial capture, second payment for
 * an upgrade). The Order's `paymentStatus` is derived from the latest
 * captured Payment.
 *
 * `gatewayOrderId` mirrors Razorpay's `order.id`; `gatewayPaymentId`
 * mirrors the `payment.id`. Both are stored for cross-system audit.
 */
const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    gateway: {
        type: String,
        enum: ['razorpay', 'manual', 'cod'],
        default: 'razorpay',
    },
    gatewayOrderId: { type: String, default: null, index: true },
    gatewayPaymentId: { type: String, default: null, index: true },
    method: { type: String, default: null, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    status: {
        type: String,
        enum: ['created', 'captured', 'failed', 'refunded', 'partially_refunded'],
        default: 'created',
        index: true,
    },
    signatureVerified: { type: Boolean, default: false },
    failureReason: { type: String, default: null },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    capturedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

paymentSchema.plugin(softDeletePlugin)

const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema, 'payments')
export default PaymentModel
