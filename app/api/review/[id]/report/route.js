import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { emitAdminBroadcast } from '@/lib/notifications'
import { recordAudit } from '@/lib/audit'
import ReviewModel from '@/models/Review.model'
import { isValidObjectId } from 'mongoose'

const REPORT_THRESHOLD = Number(process.env.REVIEW_REPORT_THRESHOLD || 3)

/**
 * POST /api/review/[id]/report — customer flags a review as
 * inappropriate. After `REVIEW_REPORT_THRESHOLD` unique reports,
 * the review auto-flips back to `pending` so the admin re-moderates.
 */
export async function POST(_request, { params }) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Please log in to report.')

        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const review = await ReviewModel.findOne({ _id: id, deletedAt: null })
        if (!review) return response(false, 404, 'Review not found.')
        if ((review.reportedBy || []).map(String).includes(String(auth.userId))) {
            return response(true, 200, 'Already reported. Thanks — our team will review.')
        }

        review.reportedBy.push(auth.userId)
        review.reportedCount = (review.reportedCount || 0) + 1

        let flippedToPending = false
        if (review.status === 'approved' && review.reportedCount >= REPORT_THRESHOLD) {
            review.status = 'pending'
            flippedToPending = true
        }
        await review.save()

        recordAudit({
            actor: auth.userId, actorRole: 'customer',
            action: 'review.report', entity: 'Review', entityId: review._id,
            meta: { newCount: review.reportedCount, flippedToPending },
        })

        if (flippedToPending) {
            emitAdminBroadcast({
                type: 'system',
                title: 'Review flagged for re-moderation',
                body: `${review.reportedCount} reports — back in queue`,
                actionUrl: `/admin/review`,
                entityType: 'Review',
                entityId: review._id,
            })
        }

        return response(true, 200, 'Reported. Our team will look into it.', {
            reportedCount: review.reportedCount,
            flippedToPending,
        })
    } catch (error) {
        return catchError(error)
    }
}
