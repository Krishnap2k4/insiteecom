import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals, GUEST_COOKIE } from '@/lib/cart'
import { getShippingSettings } from '@/lib/settings'
import ProductVariantModel from '@/models/ProductVariant.model'
import { z } from 'zod'

const bodySchema = z.object({
    productId: z.string().min(8, 'Invalid product id'),
    variantId: z.string().min(8, 'Invalid variant id'),
    qty: z.number().int().positive().max(99).default(1),
})

export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { productId, variantId, qty } = parsed.data

        const variant = await ProductVariantModel
            .findOne({ _id: variantId, deletedAt: null, status: 'active' })
            .select('product mrp sellingPrice')
            .lean()
        if (!variant || String(variant.product) !== productId) {
            return response(false, 404, 'Variant not available.')
        }

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)

        const existing = cart.items.find(
            (i) => String(i.variant) === variantId && String(i.product) === productId
        )
        if (existing) {
            existing.qty = Math.min(99, existing.qty + qty)
            existing.priceSnapshot = { mrp: variant.mrp, sellingPrice: variant.sellingPrice }
        } else {
            cart.items.push({
                product: productId,
                variant: variantId,
                qty,
                priceSnapshot: { mrp: variant.mrp, sellingPrice: variant.sellingPrice },
                addedAt: new Date(),
            })
        }
        await cart.save()

        const items = await hydrateCartItems(cart)
        const shippingSettings = await getShippingSettings()
        const totals = cartTotals(items, shippingSettings)

        const res = response(true, 200, 'Added to cart.', {
            id: String(cart._id),
            items,
            ...totals,
            couponCode: cart.couponCode,
            currency: cart.currency,
        })
        if (owner.issuedNewGuestToken) {
            res.cookies.set(GUEST_COOKIE, owner.guestToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
            })
        }
        return res
    } catch (error) {
        return catchError(error)
    }
}
