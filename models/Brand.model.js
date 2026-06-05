import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * Brand of a product. Surfaces in storefront at `/b/<slug>` and as a
 * brand chip on product cards and details.
 *
 * `isSystem: true` flags the default 'generic' brand that the
 * migration script creates so existing products can be assigned
 * without an admin step. System brands are protected from deletion.
 */
const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
    },
    description: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isSystem: {
        type: Boolean,
        default: false,
    },
    seo: {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        canonical: { type: String, trim: true },
        _id: false,
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, { timestamps: true })

brandSchema.plugin(softDeletePlugin)

const BrandModel = mongoose.models.Brand || mongoose.model('Brand', brandSchema, 'brands')
export default BrandModel
