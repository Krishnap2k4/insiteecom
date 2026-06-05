import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { emitNotification } from '@/lib/notifications'
import { sendMail } from '@/lib/sendMail'
import { renderEmailLayout } from '@/email/_layout'
import { logger } from '@/lib/logger'
import ReviewModel from '@/models/Review.model'
import UserModel from '@/models/User.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const patchSchema = z.object({
    action: z.enum(['approve', 'reject', 'reply']),
    rejectionReason: z.string().optional(),
    replyText: z.string().trim().min(1).max(2000).optional(),
})

/**
 * Admin moderation. One endpoint, three actions:
 *   - approve:  status → 'approved', emits notification + email
 *   - reject:   status → 'rejected' + rejectionReason
 *   - reply:    sets reply{by, byName, text, at}, notifies customer
 */
export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const review = await ReviewModel
            .findOne({ _id: id, deletedAt: null })
            .populate('user', 'name email')
            .populate('product', 'name slug publicId')
            .lean()
        if (!review) return response(false, 404, 'Review not found.')
        return response(true, 200, 'Review found.', review)
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const parsed = patchSchema.safeParse(await request.json())
        if (!parsed.success) return response(false, 400, 'Invalid update.')

        const review = await ReviewModel.findOne({ _id: id, deletedAt: null })
        if (!review) return response(false, 404, 'Review not found.')
        const customer = await UserModel.findById(review.user).select('name email').lean()
        const admin = await UserModel.findById(auth.userId).select('name').lean()

        const { action } = parsed.data
        let customerEmailSubject = null
        let customerEmailBody = null

        if (action === 'approve') {
            review.status = 'approved'
            review.rejectionReason = ''
            customerEmailSubject = 'Your review is live'
            customerEmailBody = renderEmailLayout({
                preheader: 'Your product review is now live',
                title: 'Your review is live',
                intro: `Thanks for taking the time — your review on <strong>${review.title}</strong> is now visible to other shoppers.`,
                bodyBlocks: [],
            })
        } else if (action === 'reject') {
            review.status = 'rejected'
            review.rejectionReason = parsed.data.rejectionReason || ''
            customerEmailSubject = 'Your review was not approved'
            customerEmailBody = renderEmailLayout({
                preheader: 'Your product review was not approved',
                title: 'Your review couldn\'t be published',
                intro: `Unfortunately we couldn't publish your review.${review.rejectionReason ? ` Reason: <em>${review.rejectionReason}</em>.` : ''} You're welcome to edit and resubmit any time.`,
                bodyBlocks: [],
            })
        } else if (action === 'reply') {
            review.reply = {
                by: auth.userId,
                byName: admin?.name || 'Support team',
                text: parsed.data.replyText || '',
                at: new Date(),
            }
            customerEmailSubject = 'A reply on your review'
            customerEmailBody = renderEmailLayout({
                preheader: 'Our team replied to your review',
                title: 'Our team replied to your review',
                intro: `<strong>${review.reply.byName}</strong> just replied to your review of <em>${review.title}</em>.`,
                bodyBlocks: [
                    `<p style="background:#f9fafb;border-left:3px solid #111827;padding:12px;font-size:14px;color:#374151;">${review.reply.text}</p>`,
                ],
            })
        }

        await review.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: `review.${action}`, entity: 'Review', entityId: review._id,
            meta: { rating: review.rating, status: review.status },
        })

        if (customer?.email && customerEmailSubject) {
            try {
                await sendMail(customerEmailSubject, customer.email, customerEmailBody)
            } catch (err) {
                logger.warn('review moderation email failed', { reviewId: String(review._id), error: err?.message })
            }
        }
        emitNotification({
            user: review.user,
            type: 'system',
            title: action === 'approve' ? 'Your review is live'
                : action === 'reject' ? 'Your review was not approved'
                    : 'A reply on your review',
            body: review.title,
            actionUrl: '/account/reviews',
            entityType: 'Review',
            entityId: review._id,
        })

        return response(true, 200, 'Updated.', { status: review.status })
    } catch (error) {
        return catchError(error)
    }
}
