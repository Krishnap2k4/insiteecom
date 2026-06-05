import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Customer-initiated return or exchange request against an order.
 *
 * Lifecycle (status):
 *   requested → approved → received → refunded   (return)
 *   requested → approved → received → replaced   (exchange)
 *   requested → rejected
 *   requested → cancelled                         (customer cancels before approval)
 *
 * `items[]` lets the customer return a subset of an order's line
 * items, identified by sku snapshot — same convention as Shipment.
 *
 * For exchanges the customer can specify `exchangeForVariant` at
 * request time (e.g. wrong size). The admin reviews and, on approval
 * + receipt, creates a replacement Shipment whose id lands in
 * `replacementShipment`.
 */
const returnItemSchema = new mongoose.Schema({
    sku: { type: String, required: true, trim: true },
    name: { type: String, default: '', trim: true },
    qty: { type: Number, required: true, min: 1 },
    reason: { type: String, default: '', trim: true },
}, { _id: false })

const exchangeTargetSchema = new mongoose.Schema({
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    sku: { type: String, default: '' },
    name: { type: String, default: '' },
    note: { type: String, default: '' },
}, { _id: false })

const returnSchema = new mongoose.Schema({
    returnNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        trim: true,
        uppercase: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    type: {
        type: String,
        enum: ['return', 'exchange'],
        default: 'return',
        required: true,
    },

    items: { type: [returnItemSchema], default: [] },
    exchangeForVariant: { type: exchangeTargetSchema, default: null },

    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'received', 'refunded', 'replaced', 'cancelled'],
        default: 'requested',
        index: true,
    },

    requestNote: { type: String, default: '', trim: true },
    adminNote: { type: String, default: '', trim: true },

    // Refund + replacement linkage (set when those follow-on actions happen).
    refund: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },
    replacementShipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },

    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

returnSchema.index({ order: 1, createdAt: -1 })
returnSchema.index({ user: 1, createdAt: -1 })

returnSchema.plugin(softDeletePlugin)

const ReturnModel = mongoose.models.Return || mongoose.model('Return', returnSchema, 'returns')
export default ReturnModel
