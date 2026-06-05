import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { sendMail } from '@/lib/sendMail'
import { newsletterWelcomeEmail } from '@/email/newsletterEvents'
import { logger } from '@/lib/logger'
import SubscriberModel from '@/models/Subscriber.model'

/**
 * Customer clicked the confirm link in their email. Mark verified and
 * send the welcome email. Idempotent — already-verified tokens get
 * the same friendly success page.
 */
export async function GET(request) {
    try {
        await connectDB()
        const token = request.nextUrl.searchParams.get('token')
        if (!token) return response(false, 400, 'Confirmation token is missing.')

        const doc = await SubscriberModel.findOne({ verificationToken: token, deletedAt: null })
        if (!doc) {
            // Maybe already verified — try a friendly lookup.
            return response(false, 400, 'This confirmation link is no longer valid.')
        }

        const wasAlreadyVerified = !!doc.verifiedAt
        doc.verifiedAt = doc.verifiedAt || new Date()
        doc.verificationToken = null
        doc.status = 'subscribed'
        await doc.save()

        if (!wasAlreadyVerified) {
            const base = process.env.NEXT_PUBLIC_BASE_URL || ''
            const unsubscribeUrl = `${base}/api/newsletter/unsubscribe?token=${doc.unsubscribeToken}`
            try {
                await sendMail('Welcome to our newsletter', doc.email, newsletterWelcomeEmail({ unsubscribeUrl }))
            } catch (err) {
                logger.warn('newsletter welcome email failed', { email: doc.email, error: err?.message })
            }
        }

        return response(true, 200, 'Subscription confirmed. Welcome aboard.')
    } catch (error) {
        return catchError(error)
    }
}
