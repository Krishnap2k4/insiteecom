import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Coupon — discount codes the storefront applies at checkout.
 *
 * Two ways to define the discount:
 *   - `discountType=percentage`, `discountValue=10` → 10% off
 *   - `discountType=fixed`,      `discountValue=200` → ₹200 off
 *
 * Scope controls *which items* the discount applies to:
 *   - `applicableCategories[]`  empty ⇒ all categories
 *   - `applicableProducts[]`    empty ⇒ all products
 *   - `excludedProducts[]`      lines matching these are skipped
 *
 * Targeting controls *which customers* can redeem:
 *   - `customerGroups[]`        empty ⇒ everyone
 *   - `firstOrderOnly: true`    only customers with zero prior orders
 *
 * Usage limits:
 *   - `usageLimit`     total redemptions allowed across all users
 *   - `usagePerUser`   redemptions allowed per individual user
 *   - both null ⇒ unlimited
 *
 * Validity window: `startsAt`/`endsAt`. Outside this window the coupon
 * is treated as inactive regardless of `status`.
 *
 * `automatic: true` reserves the coupon for auto-application (no code
 * needed). The storefront's apply endpoint still requires a code today;
 * the flag is here so the future cart-side auto-apply pass can pick
 * them up without a schema migration.
 *
 * Legacy fields (`discountPercentage`, `minShoppingAmount`, `validity`)
 * stay readable for pre-Module-4 rows. The `migrate-coupons` task
 * mirrors them into the new fields. New writes leave them empty.
 */
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    description: { type: String, default: '', trim: true },

    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
    },
    discountValue: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },

    minOrderValue: { type: Number, default: 0, min: 0 },

    usageLimit: { type: Number, default: null, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 },
    usagePerUser: { type: Number, default: null, min: 0 },

    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    customerGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup' }],
    firstOrderOnly: { type: Boolean, default: false },

    startsAt: { type: Date, default: () => new Date() },
    endsAt: { type: Date, required: true },

    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'expired'],
        default: 'active',
        index: true,
    },
    automatic: { type: Boolean, default: false, index: true },
    stackable: { type: Boolean, default: false },

    // Backreference to a Campaign (nullable — coupons can exist
    // outside any campaign).
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },

    // ---- Legacy fields kept readable ----
    discountPercentage: { type: Number },
    minShoppingAmount: { type: Number },
    validity: { type: Date },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

couponSchema.index({ endsAt: 1 })
couponSchema.index({ automatic: 1, status: 1 })

couponSchema.plugin(softDeletePlugin)

const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema, 'coupons')
export default CouponModel
