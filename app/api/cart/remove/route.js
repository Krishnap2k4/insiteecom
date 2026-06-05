import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals } from '@/lib/cart'
import { z } from 'zod'

const bodySchema = z.object({
    variantId: z.string().min(8),
})

export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { variantId } = parsed.data

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        cart.items = cart.items.filter((i) => String(i.variant) !== variantId)
        await cart.save()

        const items = await hydrateCartItems(cart)
        const totals = cartTotals(items)
        return response(true, 200, 'Removed.', {
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
