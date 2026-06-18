import crypto from 'crypto'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import CartModel from '@/models/Cart.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import ProductModel from '@/models/Product.model'
import MediaModel from '@/models/Media.model'
import InventoryModel from '@/models/Inventory.model'
import { logger } from '@/lib/logger'
import { computeShipping } from '@/lib/shipping'

export const GUEST_COOKIE = 'cart_token'
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Resolve "who is this cart for" from the request. Returns:
 *   { userId } if a valid access_token cookie is present
 *   { guestToken } if a guest cookie is present
 *   { guestToken: <new> } if no cookie at all (one will be set on response)
 *
 * The caller is responsible for actually setting the Set-Cookie header
 * when issuedNewGuestToken === true, so cart-write endpoints can
 * persist the guest identity.
 */
export const resolveCartOwner = async () => {
    const cookieStore = await cookies()
    const access = cookieStore.get('access_token')
    if (access?.value) {
        try {
            const { payload } = await jwtVerify(
                access.value,
                new TextEncoder().encode(process.env.SECRET_KEY)
            )
            if (payload?._id && payload?.role === 'user') {
                return { userId: payload._id, guestToken: null, issuedNewGuestToken: false }
            }
        } catch (err) {
            // Invalid/expired token — fall through to guest path.
            logger.debug('cart auth check: token invalid', { error: err?.message })
        }
    }

    const existing = cookieStore.get(GUEST_COOKIE)?.value
    if (existing) {
        return { userId: null, guestToken: existing, issuedNewGuestToken: false }
    }

    const fresh = crypto.randomBytes(16).toString('hex')
    return { userId: null, guestToken: fresh, issuedNewGuestToken: true }
}

/**
 * Find-or-create cart for the given owner. Pure DB op — no cookies.
 */
export const findOrCreateCart = async ({ userId, guestToken }) => {
    const filter = userId
        ? { user: userId, deletedAt: null }
        : { guestToken, deletedAt: null }
    let cart = await CartModel.findOne(filter)
    if (cart) return cart

    const doc = {
        items: [],
        currency: 'INR',
    }
    if (userId) doc.user = userId
    else {
        doc.guestToken = guestToken
        doc.expiresAt = new Date(Date.now() + GUEST_COOKIE_MAX_AGE * 1000)
    }
    cart = await CartModel.create(doc)
    return cart
}

/**
 * Hydrate cart items with current variant + product details. Returns
 * an array of plain objects shaped for the storefront UI.
 *
 * `unavailable` is true for items whose variant has been deleted /
 * archived or whose stock fell to 0. The storefront blocks checkout
 * while any item is unavailable.
 */
export const hydrateCartItems = async (cart) => {
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) return []

    const variantIds = cart.items.map((i) => i.variant)
    const variants = await ProductVariantModel
        .find({ _id: { $in: variantIds }, deletedAt: null })
        .populate({ path: 'product', select: 'name slug publicId' })
        .populate({ path: 'media', select: 'secure_url', model: MediaModel })
        .lean()

    const variantMap = new Map(variants.map((v) => [String(v._id), v]))

    const inventoryRows = await InventoryModel
        .find({ variant: { $in: variantIds }, warehouse: 'default', deletedAt: null })
        .lean()
    const inventoryMap = new Map(inventoryRows.map((r) => [String(r.variant), r]))

    return cart.items.map((item) => {
        const variant = variantMap.get(String(item.variant))
        if (!variant || variant.status === 'inactive' || !variant.product) {
            return {
                productId: String(item.product),
                variantId: String(item.variant),
                qty: item.qty,
                unavailable: true,
                unavailableReason: 'Variant no longer available',
            }
        }
        const inv = inventoryMap.get(String(item.variant))
        const available = inv ? Math.max(0, (inv.quantity || 0) - (inv.reserved || 0)) : 0
        const outOfStock = !inv?.backorderable && available <= 0
        return {
            productId: String(variant.product._id),
            variantId: String(variant._id),
            name: variant.product.name,
            slug: variant.product.slug,
            publicId: variant.product.publicId,
            sku: variant.sku,
            optionValues: variant.optionValues || [],
            color: variant.color || '',
            size: variant.size || '',
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            media: variant.media?.[0]?.secure_url || null,
            qty: item.qty,
            stock: available,
            unavailable: outOfStock,
            unavailableReason: outOfStock ? 'Out of stock' : null,
        }
    })
}

/**
 * Cart totals — pure math over hydrated items. The coupon discount is
 * applied at checkout (the coupon-apply endpoint validates), this
 * helper only sums line items.
 */
export const cartTotals = (items, shippingSettings = {}) => {
    let subtotal = 0
    let discount = 0
    let count = 0
    for (const it of items) {
        if (it.unavailable) continue
        subtotal += Number(it.sellingPrice || 0) * it.qty
        discount += Math.max(0, Number(it.mrp || 0) - Number(it.sellingPrice || 0)) * it.qty
        count += it.qty
    }
    const shippingAmount = count > 0 ? computeShipping(subtotal, shippingSettings) : 0
    return { subtotal, discount, count, shippingAmount, total: subtotal + shippingAmount }
}
