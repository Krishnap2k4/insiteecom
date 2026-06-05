import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart } from '@/lib/cart'

export async function POST() {
    try {
        await connectDB()
        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        cart.items = []
        cart.couponCode = null
        await cart.save()
        return response(true, 200, 'Cart cleared.', {
            id: String(cart._id),
            items: [],
            subtotal: 0,
            discount: 0,
            count: 0,
            total: 0,
            couponCode: null,
            currency: cart.currency,
        })
    } catch (error) {
        return catchError(error)
    }
}
