import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Server-persisted cart. Exactly one of `user` or `guestToken` is set
 * at any time. On login the guest cart is merged into the user cart
 * via /api/cart/merge.
 *
 * `priceSnapshot` on each item is captured at add-time so an in-cart
 * price change becomes visible at checkout (cart-verification step)
 * without silently re-charging the customer.
 */
const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    priceSnapshot: {
        mrp: { type: Number, default: 0 },
        sellingPrice: { type: Number, default: 0 },
    },
    addedAt: { type: Date, default: Date.now },
}, { _id: false })

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    guestToken: {
        type: String,
        default: null,
    },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    // TTL for guest carts only — userCart never expires.
    expiresAt: { type: Date, default: null, index: { expires: 0 } },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

cartSchema.index(
    { user: 1 },
    { unique: true, partialFilterExpression: { user: { $type: 'objectId' }, deletedAt: null } }
)
cartSchema.index(
    { guestToken: 1 },
    { unique: true, partialFilterExpression: { guestToken: { $type: 'string' }, deletedAt: null } }
)

cartSchema.plugin(softDeletePlugin)

const CartModel = mongoose.models.Cart || mongoose.model('Cart', cartSchema, 'carts')
export default CartModel
