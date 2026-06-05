import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { findVerifyingOrder } from '@/lib/reviews'
import ReviewModel from '@/models/Review.model'
import mongoose from 'mongoose'

/**
 * Tells the storefront whether to show the "Write a review" CTA
 * and what state it's in:
 *
 *   { authed: false }
 *       — show login prompt
 *   { authed: true, existingReview: { _id, status } }
 *       — show "Edit your review" instead of "Write"
 *   { authed: true, canReview: true, verified: true }
 *       — show CTA with a "verified buyer" hint
 *   { authed: true, canReview: true, verified: false }
 *       — show CTA (unverified reviews are still allowed; verification
 *         is informational, not a gate)
 */
export async function GET(request) {
    try {
        await connectDB()
        const productId = request.nextUrl.searchParams.get('productId')
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return response(false, 400, 'Product id required.')
        }

        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(true, 200, 'Auth state.', { authed: false })
        }

        const existing = await ReviewModel
            .findOne({ user: auth.userId, product: productId, deletedAt: null })
            .select('_id status rating title review mediaUrls')
            .lean()
        if (existing) {
            return response(true, 200, 'Existing review.', {
                authed: true,
                existingReview: {
                    _id: String(existing._id),
                    status: existing.status,
                    rating: existing.rating,
                    title: existing.title,
                    review: existing.review,
                    mediaUrls: existing.mediaUrls || [],
                },
            })
        }

        const { ok: verified } = await findVerifyingOrder({
            userId: auth.userId,
            productId,
        })
        return response(true, 200, 'Can review.', { authed: true, canReview: true, verified })
    } catch (error) {
        return catchError(error)
    }
}
