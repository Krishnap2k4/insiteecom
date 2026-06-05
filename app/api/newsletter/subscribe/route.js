import crypto from 'crypto'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { RATE_LIMITS, rateLimit } from '@/lib/rateLimit'
import { sendMail } from '@/lib/sendMail'
import { newsletterConfirmEmail } from '@/email/newsletterEvents'
import { logger } from '@/lib/logger'
import SubscriberModel from '@/models/Subscriber.model'
import { z } from 'zod'

const bodySchema = z.object({
    email: z.string().email().transform((s) => s.toLowerCase().trim()),
    name: z.string().trim().optional().default(''),
    source: z.string().trim().optional().default('footer'),
})

/**
 * Public subscribe endpoint with double opt-in.
 *
 *   - First submission for an email → create row, set
 *     `verificationToken`, send confirmation email. Status starts as
 *     `subscribed` but `verifiedAt` is null; outbound sends should
 *     skip until verified.
 *   - Re-submission for an unverified email → resend confirmation.
 *   - Re-submission for an already-verified email → no-op success
 *     (we don't email twice).
 *   - Re-submission for an unsubscribed email → flip back to
 *     `subscribed` and send a fresh confirmation.
 */
export async function POST(request) {
    const limited = rateLimit(request, { name: 'newsletter.subscribe', ...RATE_LIMITS.AUTH_BURST })
    if (limited) return limited

    try {
        await connectDB()
        const payload = await request.json().catch(() => ({}))
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Please enter a valid email.', { issues: parsed.error.issues })
        }
        const { email, name, source } = parsed.data

        let doc = await SubscriberModel.findOne({ email, deletedAt: null })
        const verificationToken = crypto.randomBytes(20).toString('hex')
        const unsubscribeToken = doc?.unsubscribeToken || crypto.randomBytes(20).toString('hex')
        const base = process.env.NEXT_PUBLIC_BASE_URL || ''
        const confirmUrl = `${base}/api/newsletter/confirm?token=${verificationToken}`

        if (!doc) {
            doc = await SubscriberModel.create({
                email, name, source,
                status: 'subscribed',
                verificationToken,
                unsubscribeToken,
                ip: request.headers.get('x-forwarded-for') || '',
                userAgent: request.headers.get('user-agent') || '',
            })
        } else if (doc.verifiedAt) {
            return response(true, 200, 'You are already subscribed.')
        } else {
            doc.status = 'subscribed'
            doc.verificationToken = verificationToken
            doc.unsubscribeToken = unsubscribeToken
            doc.name = name || doc.name
            doc.source = source || doc.source
            doc.unsubscribedAt = null
            await doc.save()
        }

        try {
            await sendMail('Confirm your subscription', email, newsletterConfirmEmail({ confirmUrl }))
        } catch (err) {
            logger.warn('newsletter confirm email failed', { email, error: err?.message })
        }

        return response(true, 200, 'Please check your inbox to confirm your subscription.')
    } catch (error) {
        return catchError(error)
    }
}
