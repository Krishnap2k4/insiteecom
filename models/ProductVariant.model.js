import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * A sellable SKU. Every variant belongs to a Product. A product is
 * only purchasable once at least one variant has been added — there
 * is no implicit "default" variant.
 *
 * `optionValues[]` carries the chosen value for each option defined
 * on the parent product. For products with no options (single-SKU),
 * `optionValues` is an empty array.
 *
 * `color` and `size` are denormalised mirrors of the corresponding
 * optionValues (when present). They exist purely so the legacy cart
 * format and the storefront `Filter.jsx` colors/sizes endpoints keep
 * working without per-call adapter code. The variant API auto-derives
 * them from `optionValues` on every write — admins never set them
 * directly. Module 3 (Orders) will revisit and likely drop them.
 */
const ProductVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    // Denormalised mirrors of optionValues — see header comment.
    color: {
        type: String,
        default: '',
        trim: true,
    },
    size: {
        type: String,
        default: '',
        trim: true,
    },

    mrp: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    media: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media',
            required: true
        }
    ],

    // Each entry matches an option defined on the parent product and
    // picks a value from that option's allowed list. Empty for
    // single-SKU products (parent has no options).
    optionValues: [{
        name: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        _id: false,
    }],

    // Module 3 / Module 5 metadata — all optional.
    barcode: { type: String, trim: true },
    costPrice: { type: Number },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true,
    },

    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })


ProductVariantSchema.plugin(softDeletePlugin)

const ProductVariantModel = mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema, 'productvariants')
export default ProductVariantModel
