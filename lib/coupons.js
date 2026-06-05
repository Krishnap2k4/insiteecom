import CouponModel from '@/models/Coupon.model'
import CouponRedemptionModel from '@/models/CouponRedemption.model'
import OrderModel from '@/models/Order.model'
import ProductModel from '@/models/Product.model'
import UserModel from '@/models/User.model'

/**
 * Resolve and validate a coupon against a hydrated cart for a given
 * customer context. Returns `{ ok, coupon, applicableSubtotal,
 * discountAmount, reason? }`.
 *
 * `cartItems` shape (matches `lib/cart.hydrateCartItems`):
 *   [{ productId, variantId, qty, mrp, sellingPrice, ... }]
 *
 * `userId` (optional): when present, per-user limit + first-order +
 * customer-group rules can be enforced. Guests skip the per-user
 * checks (still subject to global usageLimit).
 *
 * The function never mutates anything — recording redemption is the
 * caller's job once the order actually saves.
 */
export const resolveCoupon = async ({ code, cartItems = [], userId = null, subtotalHint = null }) => {
    if (!code) return { ok: false, reason: 'Coupon code is required.' }
    const normalized = String(code).trim().toUpperCase()

    const coupon = await CouponModel.findOne({ code: normalized, deletedAt: null }).lean()
    if (!coupon) return { ok: false, reason: 'Invalid coupon code.' }

    // ---- Status + window ----
    if (coupon.status === 'paused') return { ok: false, reason: 'This coupon is currently paused.' }
    if (coupon.status === 'draft') return { ok: false, reason: 'This coupon is not active yet.' }
    const now = new Date()
    const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null
    const endsAt = coupon.endsAt ? new Date(coupon.endsAt) : (coupon.validity ? new Date(coupon.validity) : null)
    if (startsAt && now < startsAt) return { ok: false, reason: 'This coupon is not active yet.' }
    if (endsAt && now > endsAt) return { ok: false, reason: 'This coupon has expired.' }

    // ---- Usage limit (total) ----
    if (coupon.usageLimit != null && (coupon.usageCount || 0) >= coupon.usageLimit) {
        return { ok: false, reason: 'This coupon has reached its usage limit.' }
    }

    // ---- Per-user usage limit ----
    if (userId && coupon.usagePerUser != null) {
        const userUses = await CouponRedemptionModel.countDocuments({ coupon: coupon._id, user: userId })
        if (userUses >= coupon.usagePerUser) {
            return { ok: false, reason: 'You have already used this coupon.' }
        }
    }

    // ---- Customer group targeting ----
    if (userId && Array.isArray(coupon.customerGroups) && coupon.customerGroups.length > 0) {
        const user = await UserModel.findById(userId).select('customerGroup').lean()
        const userGroup = user?.customerGroup ? String(user.customerGroup) : null
        const groupIds = coupon.customerGroups.map((g) => String(g))
        if (!userGroup || !groupIds.includes(userGroup)) {
            return { ok: false, reason: 'This coupon is not available for your account.' }
        }
    }

    // ---- First-order only ----
    if (coupon.firstOrderOnly) {
        if (!userId) return { ok: false, reason: 'This coupon is for first-time customers — please log in.' }
        const priorOrders = await OrderModel.countDocuments({
            user: userId,
            paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] },
            deletedAt: null,
        })
        if (priorOrders > 0) return { ok: false, reason: 'This coupon is only valid on the first order.' }
    }

    // ---- Scope: applicable categories / products / excluded ----
    // Pre-compute eligibility flag per cart line. An empty
    // applicable* set means "all" — same convention as Shopify.
    const productIds = cartItems.map((i) => i.productId).filter(Boolean)
    let productsMap = new Map()
    if (productIds.length > 0) {
        const docs = await ProductModel
            .find({ _id: { $in: productIds }, deletedAt: null })
            .select('_id categories')
            .lean()
        productsMap = new Map(docs.map((d) => [String(d._id), d]))
    }

    const applicableCats = new Set((coupon.applicableCategories || []).map((c) => String(c)))
    const applicableProds = new Set((coupon.applicableProducts || []).map((p) => String(p)))
    const excludedProds = new Set((coupon.excludedProducts || []).map((p) => String(p)))

    const lineIsEligible = (item) => {
        const pid = String(item.productId)
        if (excludedProds.has(pid)) return false
        if (applicableProds.size > 0 && !applicableProds.has(pid)) return false
        if (applicableCats.size > 0) {
            const cats = (productsMap.get(pid)?.categories || []).map((c) => String(c))
            if (!cats.some((c) => applicableCats.has(c))) return false
        }
        return true
    }

    let applicableSubtotal = 0
    for (const it of cartItems) {
        if (!lineIsEligible(it)) continue
        applicableSubtotal += Number(it.sellingPrice || 0) * (it.qty || 0)
    }

    if (applicableSubtotal <= 0) {
        // No matching line items at all.
        return { ok: false, reason: 'No items in your cart qualify for this coupon.' }
    }

    // ---- Min order value ----
    // We measure against either applicableSubtotal or the cart's full
    // subtotal hint, whichever is provided. Shopify checks against
    // *cart subtotal* — match that behavior when we have it.
    const minOrderTarget = coupon.minOrderValue || coupon.minShoppingAmount || 0
    if (minOrderTarget > 0) {
        const target = subtotalHint != null ? subtotalHint : applicableSubtotal
        if (target < minOrderTarget) {
            return { ok: false, reason: `Add ₹${(minOrderTarget - target).toFixed(0)} more to use this coupon.` }
        }
    }

    // ---- Compute discount on applicable subtotal ----
    let discountAmount = 0
    const valueNum = Number(coupon.discountValue || coupon.discountPercentage || 0)
    if (coupon.discountType === 'fixed') {
        discountAmount = Math.min(valueNum, applicableSubtotal)
    } else {
        // percentage
        discountAmount = (applicableSubtotal * valueNum) / 100
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount
        }
    }
    discountAmount = Math.max(0, Math.round(discountAmount))

    return {
        ok: true,
        coupon,
        code: coupon.code,
        applicableSubtotal,
        discountAmount,
    }
}

/**
 * Atomically record a redemption + bump usageCount. Called from
 * /api/payment/save-order once the order row commits.
 */
export const recordCouponRedemption = async ({ coupon, code, user, guestEmail, order, discountAmount, currency }) => {
    if (!coupon || !order) return null
    await CouponRedemptionModel.create({
        coupon: coupon._id || coupon,
        user: user || null,
        guestEmail: guestEmail || null,
        order: order._id || order,
        code: (code || coupon.code || '').toUpperCase(),
        discountAmount: discountAmount || 0,
        currency: currency || 'INR',
    })
    await CouponModel.updateOne({ _id: coupon._id || coupon }, { $inc: { usageCount: 1 } })
}
