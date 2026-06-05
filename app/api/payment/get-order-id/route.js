import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { RATE_LIMITS, rateLimit } from '@/lib/rateLimit'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals } from '@/lib/cart'
import { z } from 'zod'
import Razorpay from 'razorpay'

const bodySchema = z.object({
    couponCode: z.string().trim().optional().nullable(),
    couponDiscountAmount: z.number().nonnegative().optional().default(0),
})

/**
 * Server-authoritative Razorpay order creation. The amount is derived
 * from the live cart (NOT the client) so a tampered checkout payload
 * cannot under-pay. Coupon discount is accepted as a hint and verified
 * by /api/coupon/apply earlier in the flow.
 */
export async function POST(request) {
    const limited = rateLimit(request, { name: 'payment.get-order-id', ...RATE_LIMITS.PAYMENT })
    if (limited) return limited

    try {
        await connectDB()
        const payload = await request.json().catch(() => ({}))
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const couponDiscountAmount = Math.max(0, parsed.data.couponDiscountAmount || 0)

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        const items = await hydrateCartItems(cart)

        if (items.length === 0) return response(false, 400, 'Cart is empty.')
        if (items.some((i) => i.unavailable)) {
            return response(false, 400, 'One or more items in your cart are unavailable.')
        }

        const totals = cartTotals(items)
        const totalAmount = Math.max(0, totals.subtotal - couponDiscountAmount)
        if (totalAmount <= 0) return response(false, 400, 'Order total must be greater than zero.')

        const razInstance = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
        const order = await razInstance.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: cart.currency || 'INR',
        })

        return response(true, 200, 'Order id generated.', {
            order_id: order.id,
            amount: totalAmount,
            currency: cart.currency || 'INR',
        })
    } catch (error) {
        return catchError(error)
    }
}
