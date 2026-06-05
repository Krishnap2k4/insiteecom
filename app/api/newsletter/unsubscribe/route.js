import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import SubscriberModel from '@/models/Subscriber.model'
import { z } from 'zod'

/**
 * One-click unsubscribe.
 *
 *   - GET with `?token=…` → token-based (used in every outbound email
 *     under the standard "Unsubscribe" link).
 *   - POST with `{ email }` → email-based (used by the storefront's
 *     unsubscribe form when the customer doesn't have the link).
 *
 * Both responses are intentionally generic so the endpoint can't be
 * used to enumerate which emails are on the list.
 */
const flipUnsubscribed = async (doc) => {
    if (doc.status === 'unsubscribed') return
    doc.status = 'unsubscribed'
    doc.unsubscribedAt = new Date()
    await doc.save()
}

export async function GET(request) {
    try {
        await connectDB()
        const token = request.nextUrl.searchParams.get('token')
        if (!token) return response(false, 400, 'Unsubscribe token is missing.')

        const doc = await SubscriberModel.findOne({ unsubscribeToken: token, deletedAt: null })
        if (doc) await flipUnsubscribed(doc)
        return response(true, 200, "You're unsubscribed. Sorry to see you go!")
    } catch (error) {
        return catchError(error)
    }
}

const bodySchema = z.object({ email: z.string().email() })

export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json().catch(() => ({}))
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) return response(false, 400, 'Please enter a valid email.')

        const doc = await SubscriberModel.findOne({ email: parsed.data.email.toLowerCase(), deletedAt: null })
        if (doc) await flipUnsubscribed(doc)
        return response(true, 200, 'If that email is on our list, it has been removed.')
    } catch (error) {
        return catchError(error)
    }
}
