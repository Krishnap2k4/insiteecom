import mongoose from "mongoose";

/**
 * One row per saved product per user.
 *
 * Stored per-item rather than embedded so:
 *   - queries can paginate large wishlists
 *   - removing an item is a simple deleteOne by id
 *   - duplicate-add is prevented by the unique compound index
 *
 * `variant` is optional — customers can wishlist a generic product
 * even before picking a variant.
 */
const wishlistItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        default: null,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true })

// A (user, product, variant=null) row is distinct from
// (user, product, variant=<id>) — the customer can wishlist
// "this product" and "this product in red size M" separately.
wishlistItemSchema.index(
    { user: 1, product: 1, variant: 1 },
    { unique: true }
)

const WishlistItemModel =
    mongoose.models.WishlistItem ||
    mongoose.model('WishlistItem', wishlistItemSchema, 'wishlistitems')

export default WishlistItemModel
