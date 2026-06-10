import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * A "Shop the Look" video card shown on the home page.
 * Admins supply a video URL (Cloudinary, YouTube, Vimeo) and optionally
 * link a product so the popup shows product info + a "View Product" CTA.
 *
 * When the CMS module ships, this collection can be referenced as a
 * `lookbook` block type inside a Page's blocks[]. Until then the home
 * page fetches directly from /api/shop-the-look.
 */
const ShopTheLookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: '' },
        videoUrl: { type: String, required: true, trim: true },
        thumbnail: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        deletedAt: { type: Date, default: null, index: true },
    },
    { timestamps: true }
)

ShopTheLookSchema.plugin(softDeletePlugin)

const ShopTheLookModel =
    mongoose.models.ShopTheLook ||
    mongoose.model('ShopTheLook', ShopTheLookSchema, 'shopthelooks')

export default ShopTheLookModel
