import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ReviewModel from '@/models/Review.model'
import { isValidObjectId } from 'mongoose'

/**
 * POST /api/review/[id]/helpful — toggle the caller's helpful vote.
 * One vote per user per review. Re-posting removes the vote.
 *
 * Implemented with two atomic $pull / $addToSet operations + a
 * $set of the count derived from the array length, so the count
 * never drifts.
 */
export async function POST(_request, { params }) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Please log in to vote.')

        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const review = await ReviewModel.findOne({ _id: id, deletedAt: null, status: 'approved' }).select('helpfulVoters')
        if (!review) return response(false, 404, 'Review not found.')

        const already = (review.helpfulVoters || []).map(String).includes(String(auth.userId))
        if (already) {
            await ReviewModel.updateOne(
                { _id: id },
                { $pull: { helpfulVoters: auth.userId } }
            )
        } else {
            await ReviewModel.updateOne(
                { _id: id },
                { $addToSet: { helpfulVoters: auth.userId } }
            )
        }
        const fresh = await ReviewModel.findById(id).select('helpfulVoters').lean()
        const count = (fresh?.helpfulVoters || []).length
        await ReviewModel.updateOne({ _id: id }, { $set: { helpfulCount: count } })

        return response(true, 200, already ? 'Vote removed.' : 'Thanks for voting.', {
            helpfulCount: count,
            helpfulByMe: !already,
        })
    } catch (error) {
        return catchError(error)
    }
}
