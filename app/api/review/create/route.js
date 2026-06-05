import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { findVerifyingOrder } from '@/lib/reviews'
import { recordAudit } from '@/lib/audit'
import { emitAdminBroadcast } from '@/lib/notifications'
import ReviewModel from '@/models/Review.model'
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const bodySchema = z.object({
    product: objectId,
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().min(3).max(160),
    review: z.string().trim().min(10).max(4000),
    mediaUrls: z.array(z.string().trim()).max(8).optional().default([]),
})

/**
 * POST /api/review/create — auth required.
 *
 *   - Looks up a fulfilled paid order containing the product; if
 *     found, the review opens with `verifiedBuyer: true` AND
 *     `status: 'pending'` (admin moderation still applies — verified
 *     reviews aren't auto-approved, just badged).
 *   - One review per (user, product). A second submission updates
 *     the existing row (back to pending for re-moderation).
 */
export async function POST(request) {
    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Please log in to write a review.')

        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Please check the fields and try again.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        const { ok: isVerified, orderId } = await findVerifyingOrder({
            userId: auth.userId,
            productId: data.product,
        })

        const existing = await ReviewModel.findOne({
            user: auth.userId,
            product: data.product,
            deletedAt: null,
        })
        if (existing) {
            existing.rating = data.rating
            existing.title = data.title
            existing.review = data.review
            existing.mediaUrls = data.mediaUrls
            existing.verifiedBuyer = isVerified
            existing.order = orderId || existing.order
            existing.status = 'pending'
            existing.rejectionReason = ''
            existing.reply = null
            await existing.save()
            recordAudit({
                actor: auth.userId, actorRole: 'customer',
                action: 'review.update', entity: 'Review', entityId: existing._id,
                meta: { product: data.product, rating: data.rating, verified: isVerified },
            })
            return response(true, 200, 'Review updated — pending moderation.', { _id: String(existing._id) })
        }

        const doc = await ReviewModel.create({
            product: data.product,
            user: auth.userId,
            order: orderId || null,
            rating: data.rating,
            title: data.title,
            review: data.review,
            mediaUrls: data.mediaUrls,
            verifiedBuyer: isVerified,
            status: 'pending',
        })
        recordAudit({
            actor: auth.userId, actorRole: 'customer',
            action: 'review.create', entity: 'Review', entityId: doc._id,
            meta: { product: data.product, rating: data.rating, verified: isVerified },
        })
        emitAdminBroadcast({
            type: 'system',
            title: 'New review awaiting moderation',
            body: `${data.rating}★ — ${data.title}`,
            actionUrl: `/admin/review`,
            entityType: 'Review',
            entityId: doc._id,
        })

        return response(true, 200, 'Thanks — your review is in moderation.', {
            _id: String(doc._id),
            verifiedBuyer: isVerified,
        })
    } catch (error) {
        return catchError(error)
    }
}
