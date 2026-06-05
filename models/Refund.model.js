import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Refund against a Payment. Multiple partial refunds against the same
 * payment are allowed — the sum cannot exceed the captured amount.
 * Validation lives in the API route, not the schema, so admin replays
 * for legacy data don't trip on it.
 */
const refundSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null,
        index: true,
    },
    gatewayRefundId: { type: String, default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    status: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
        default: 'pending',
    },
    reason: { type: String, default: '', trim: true },
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    processedAt: { type: Date, default: null },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

refundSchema.plugin(softDeletePlugin)

const RefundModel = mongoose.models.Refund || mongoose.model('Refund', refundSchema, 'refunds')
export default RefundModel
