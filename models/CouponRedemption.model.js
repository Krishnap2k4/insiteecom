import mongoose from 'mongoose'

/**
 * Append-only log of every successful coupon redemption. Two jobs:
 *   1. Enforce `usagePerUser` — count rows by (coupon, user).
 *   2. Power redemption analytics in the campaigns report.
 *
 * Never edited. Soft-delete intentionally not applied; a refund/cancel
 * does not unwind the redemption — admins decide whether to free the
 * count by writing a manual adjustment.
 */
const couponRedemptionSchema = new mongoose.Schema({
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    guestEmail: { type: String, default: null, lowercase: true, trim: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },

    code: { type: String, required: true, uppercase: true, trim: true },
    discountAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
}, { timestamps: true })

couponRedemptionSchema.index({ coupon: 1, user: 1 })

const CouponRedemptionModel = mongoose.models.CouponRedemption
    || mongoose.model('CouponRedemption', couponRedemptionSchema, 'couponredemptions')
export default CouponRedemptionModel
