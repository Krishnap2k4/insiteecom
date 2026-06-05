import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'
import { orderStatus, paymentStatus, fulfillmentStatus } from '@/lib/utils'

/**
 * Immutable snapshot of an address as it existed at the moment the
 * order was placed. We deliberately copy the values instead of
 * referencing the Address record so a later edit/delete in the user's
 * address book never alters historical order shipping info.
 */
const addressSnapshotSchema = new mongoose.Schema({
    fullName: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    line1: { type: String, default: '', trim: true },
    line2: { type: String, default: '', trim: true },
    landmark: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    // Reference back to the source address (nullable — guest orders
    // and ad-hoc admin entries won't have one).
    sourceAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
}, { _id: false })

/**
 * One line item per (variant × occurrence). Stores snapshots of every
 * price + identity field so historical orders stay coherent even when
 * the underlying product / variant changes or is deleted.
 */
const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    optionValuesSnapshot: [{
        name: { type: String, trim: true },
        value: { type: String, trim: true },
        _id: false,
    }],
    qty: { type: Number, required: true, min: 1 },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    lineSubtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false })

const orderSchema = new mongoose.Schema({
    // Human-friendly identifier shown to the customer ("ORD-25060300A3").
    orderNumber: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true,
    },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    guestToken: { type: String, default: null, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    items: { type: [orderItemSchema], default: [] },

    shippingAddress: { type: addressSnapshotSchema, default: () => ({}) },
    billingAddress: { type: addressSnapshotSchema, default: () => ({}) },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
    couponDiscountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    exchangeRate: { type: Number, default: 1 },

    paymentStatus: {
        type: String,
        enum: paymentStatus,
        default: 'pending',
        index: true,
    },
    fulfillmentStatus: {
        type: String,
        enum: fulfillmentStatus,
        default: 'unfulfilled',
        index: true,
    },
    // Legacy combined status — kept for back-compat with existing
    // admin views + dashboard widgets. Derived from paymentStatus +
    // fulfillmentStatus on writes; old rows still read fine.
    status: {
        type: String,
        enum: orderStatus,
        default: 'pending',
        index: true,
    },

    // 'razorpay' — paid online via the gateway
    // 'cod'      — pay on delivery (collected as cash, marked by admin)
    // 'manual'   — admin recorded an out-of-band payment
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'cod', 'manual'],
        default: 'razorpay',
        index: true,
    },

    channel: { type: String, default: 'web', trim: true },
    source: { type: String, default: '', trim: true },
    customerNote: { type: String, default: '', trim: true },
    adminNotes: { type: String, default: '', trim: true },

    // ---- legacy fields kept readable for pre-Module-3 orders ----
    // These mirror the old flat schema. New writes leave them empty;
    // the storefront/admin UIs use the new structured fields and fall
    // back to these only when the new ones are absent (handled in the
    // detail API).
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' },
    ordernote: { type: String, default: '' },
    products: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    payment_id: { type: String, default: null },
    order_id: { type: String, default: null, index: true },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })

orderSchema.plugin(softDeletePlugin)

const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders')
export default OrderModel
