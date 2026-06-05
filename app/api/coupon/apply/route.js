import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals } from '@/lib/cart'
import { resolveCoupon } from '@/lib/coupons'
import { z } from 'zod'

const bodySchema = z.object({
    code: z.string().trim().min(1, 'Coupon code is required.'),
})

/**
 * Storefront calls this from the checkout coupon form. We pull the
 * live cart server-side (the client's `minShoppingAmount` is no
 * longer trusted) and let `resolveCoupon` run every validation.
 *
 * Auth is optional — guests can apply codes too, but rules that
 * require a user (first-order, per-user limit, customer-group) only
 * fire when the JWT is valid.
 */
export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json().catch(() => ({}))
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Coupon code is required.', { issues: parsed.error.issues })
        }

        // Best-effort auth resolution. Guests still get to apply
        // codes that don't gate on user identity.
        let userId = null
        try {
            const cookieStore = await cookies()
            const access = cookieStore.get('access_token')
            if (access?.value) {
                const { payload: jwt } = await jwtVerify(
                    access.value,
                    new TextEncoder().encode(process.env.SECRET_KEY)
                )
                if (jwt?._id && jwt?.role === 'user') userId = jwt._id
            }
        } catch { /* unauth — fall through as guest */ }

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        const items = await hydrateCartItems(cart)
        if (items.length === 0) return response(false, 400, 'Cart is empty.')
        if (items.some((i) => i.unavailable)) {
            return response(false, 400, 'Remove unavailable items before applying a coupon.')
        }

        const totals = cartTotals(items)
        const result = await resolveCoupon({
            code: parsed.data.code,
            cartItems: items,
            userId,
            subtotalHint: totals.subtotal,
        })

        if (!result.ok) return response(false, 400, result.reason)

        return response(true, 200, 'Coupon applied successfully.', {
            code: result.code,
            discountType: result.coupon.discountType,
            discountValue: result.coupon.discountValue || result.coupon.discountPercentage || 0,
            discountAmount: result.discountAmount,
            applicableSubtotal: result.applicableSubtotal,
            // Back-compat hint for the existing checkout UI which still
            // uses `discountPercentage` for the percent label.
            discountPercentage: result.coupon.discountType === 'percentage'
                ? (result.coupon.discountValue || result.coupon.discountPercentage || 0)
                : 0,
        })
    } catch (error) {
        return catchError(error)
    }
}
