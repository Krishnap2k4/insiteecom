import mongoose from 'mongoose'

/**
 * Append-only timeline of every state change on an order:
 *   - payment lifecycle (pending → paid → refunded)
 *   - fulfillment lifecycle (unfulfilled → partial → fulfilled)
 *   - any free-form admin-driven status note
 *
 * Never edited or deleted — for billing disputes the history is the
 * source of truth.
 */
const orderStatusHistorySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    statusType: {
        type: String,
        enum: ['payment', 'fulfillment', 'order'],
        required: true,
    },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    note: { type: String, default: '', trim: true },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    actorRole: {
        type: String,
        enum: ['system', 'admin', 'customer', 'support'],
        default: 'system',
    },
}, { timestamps: true })

orderStatusHistorySchema.index({ order: 1, createdAt: -1 })

const OrderStatusHistoryModel = mongoose.models.OrderStatusHistory
    || mongoose.model('OrderStatusHistory', orderStatusHistorySchema, 'orderstatushistories')
export default OrderStatusHistoryModel
