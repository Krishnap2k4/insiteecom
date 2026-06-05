import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * A single shipment carrying one or more order line-items. An order
 * with mixed warehouses or backordered SKUs can have multiple
 * shipments; each carries its own tracking + carrier.
 *
 * `items[]` references line items by their sku snapshot rather than a
 * subdoc id, so legacy orders (which used a different OrderItem id
 * shape) still match.
 */
const shipmentItemSchema = new mongoose.Schema({
    sku: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
}, { _id: false })

const shipmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    items: { type: [shipmentItemSchema], default: [] },
    carrier: { type: String, default: '', trim: true },
    trackingNumber: { type: String, default: '', trim: true },
    trackingUrl: { type: String, default: '', trim: true },
    status: {
        type: String,
        enum: ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled'],
        default: 'pending',
        index: true,
    },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    notes: { type: String, default: '', trim: true },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

shipmentSchema.plugin(softDeletePlugin)

const ShipmentModel = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema, 'shipments')
export default ShipmentModel
