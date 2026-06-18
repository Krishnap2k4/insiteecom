import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals, GUEST_COOKIE } from '@/lib/cart'
import { getShippingSettings } from '@/lib/settings'

/**
 * GET current cart — for both authenticated users and guests.
 * Issues a guest cookie on first contact so subsequent writes persist.
 */
export async function GET() {
    try {
        await connectDB()
        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        const items = await hydrateCartItems(cart)
        const shippingSettings = await getShippingSettings()
        const totals = cartTotals(items, shippingSettings)

        const res = response(true, 200, 'Cart fetched.', {
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
