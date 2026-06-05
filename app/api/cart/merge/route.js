import { cookies } from 'next/headers'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { isAuthenticated } from '@/lib/authentication'
import { findOrCreateCart, GUEST_COOKIE } from '@/lib/cart'
import CartModel from '@/models/Cart.model'

/**
 * POST /api/cart/merge — called once right after login. Picks up the
 * guest cart by cookie token, merges its lines into the authenticated
 * user's cart, then clears the guest cart + cookie.
 *
 * Merge rule: same variant → sum quantities (capped at 99).
 */
export async function POST() {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const cookieStore = await cookies()
        const guestToken = cookieStore.get(GUEST_COOKIE)?.value

        const userCart = await findOrCreateCart({ userId: auth.userId, guestToken: null })

        let merged = 0
        if (guestToken) {
            const guestCart = await CartModel.findOne({ guestToken, deletedAt: null })
            if (guestCart && guestCart.items.length > 0) {
                for (const item of guestCart.items) {
                    const existing = userCart.items.find(
                        (i) => String(i.variant) === String(item.variant)
                    )
                    if (existing) {
                        existing.qty = Math.min(99, existing.qty + item.qty)
                    } else {
                        userCart.items.push({
                            product: item.product,
                            variant: item.variant,
                            qty: Math.min(99, item.qty),
                            priceSnapshot: item.priceSnapshot,
                            addedAt: item.addedAt || new Date(),
                        })
                    }
                    merged += 1
                }
                if (!userCart.couponCode && guestCart.couponCode) {
                    userCart.couponCode = guestCart.couponCode
                }
                await userCart.save()
                guestCart.items = []
                guestCart.deletedAt = new Date()
                await guestCart.save()
            }
        }

        const res = response(true, 200, 'Cart merged.', { merged })
        // Clear the guest cookie either way — the user now owns the cart.
        res.cookies.set(GUEST_COOKIE, '', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 0,
        })
        return res
    } catch (error) {
        return catchError(error)
    }
}
