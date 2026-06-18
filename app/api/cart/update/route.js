import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals } from '@/lib/cart'
import { getShippingSettings } from '@/lib/settings'
import { z } from 'zod'

const bodySchema = z.object({
    variantId: z.string().min(8),
    qty: z.number().int().min(0).max(99),
})

/**
 * PUT /api/cart/update — set qty for a line. `qty=0` removes the line.
 */
export async function PUT(request) {
    try {
        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { variantId, qty } = parsed.data

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)

        const idx = cart.items.findIndex((i) => String(i.variant) === variantId)
        if (idx === -1) return response(false, 404, 'Item not in cart.')

        if (qty === 0) cart.items.splice(idx, 1)
        else cart.items[idx].qty = qty
        await cart.save()

        const items = await hydrateCartItems(cart)
        const shippingSettings = await getShippingSettings()
        const totals = cartTotals(items, shippingSettings)

        return response(true, 200, 'Cart updated.', {
            id: String(cart._id),
            items,
            ...totals,
            couponCode: cart.couponCode,
            currency: cart.currency,
        })
    } catch (error) {
        return catchError(error)
    }
}
