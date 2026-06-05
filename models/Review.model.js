import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Product review — Shopify-shaped.
 *
 * `verifiedBuyer: true` is set automatically by `/api/review/create`
 * when the customer has a fulfilled paid order containing this exact
 * product. The frontend uses this for a "Verified buyer" badge.
 *
 * Moderation lifecycle:
 *   pending → approved (visible publicly)
 *   pending → rejected (hidden; customer notified with reason)
 *
 * `helpfulVoters[]` stores user ids who voted helpful so we can
 * dedupe + offer "undo". `reportedBy[]` does the same for reports;
 * crossing a threshold should flip a review back to pending for
 * re-moderation (admin choice).
 *
 * `reply` is the staff response that renders inline under the review
 * — same convention as Amazon / Shopify.
 */
const replySchema = new mongoose.Schema({
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, default: '', trim: true },
    text: { type: String, default: '', trim: true },
    at: { type: Date, default: Date.now },
}, { _id: false })

const reviewSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    review: { type: String, required: true, trim: true, maxlength: 4000 },
    mediaUrls: [{ type: String, trim: true }],

    verifiedBuyer: { type: Boolean, default: false, index: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    rejectionReason: { type: String, default: '', trim: true },

    helpfulCount: { type: Number, default: 0, min: 0 },
    helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    reportedCount: { type: Number, default: 0, min: 0 },
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    reply: { type: replySchema, default: null },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

reviewSchema.index({ product: 1, status: 1, createdAt: -1 })
reviewSchema.index({ user: 1, product: 1 })

reviewSchema.plugin(softDeletePlugin)

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema, 'reviews')
export default ReviewModel
