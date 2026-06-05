import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals } from '@/lib/cart'
import { z } from 'zod'

/**
 * Apply/clear a coupon code on the cart. The actual coupon validation
 * still lives in /api/coupon/apply and runs at checkout; this just
 * persists the chosen code so it survives navigation.
 */
const bodySchema = z.object({ code: z.string().trim().nullable() })

export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const code = parsed.data.code ? parsed.data.code.trim().toUpperCase() : null

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        cart.couponCode = code
        await cart.save()

        const items = await hydrateCartItems(cart)
        const totals = cartTotals(items)
        return response(true, 200, code ? 'Coupon saved.' : 'Coupon removed.', {
            id: String(cart._id),
            items, ...totals, couponCode: cart.couponCode, currency: cart.currency,
        })
    } catch (error) {
        return catchError(error)
    }
}
