import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ReviewModel from '@/models/Review.model'
import mongoose from 'mongoose'

/**
 * Public storefront listing for a product's reviews. Returns only
 * approved reviews PLUS the requesting user's own pending/rejected
 * ones so they can see their own moderation state.
 *
 * Sort modes (Shopify-style):
 *   most_helpful  — helpfulCount desc, then recency
 *   newest        — createdAt desc
 *   highest       — rating desc, then helpful
 *   lowest        — rating asc, then recency
 *   with_photos   — mediaUrls > 0, then helpful
 *   verified      — verifiedBuyer = true, then helpful
 */
const SORT_MAP = {
    most_helpful: { helpfulCount: -1, createdAt: -1 },
    newest: { createdAt: -1 },
    highest: { rating: -1, helpfulCount: -1 },
    lowest: { rating: 1, createdAt: -1 },
    with_photos: { helpfulCount: -1, createdAt: -1 },
    verified: { helpfulCount: -1, createdAt: -1 },
}

const resolveCallerUserId = async () => {
    try {
        const cookieStore = await cookies()
        const access = cookieStore.get('access_token')
        if (!access?.value) return null
        const { payload } = await jwtVerify(
            access.value,
            new TextEncoder().encode(process.env.SECRET_KEY),
        )
        return payload?._id || null
    } catch {
        return null
    }
}

export async function GET(request) {
    try {
        await connectDB()
        const sp = request.nextUrl.searchParams
        const productId = sp.get('productId')
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return response(false, 400, 'Product id required.')
        }
        const page = Math.max(0, parseInt(sp.get('page') || '0', 10))
        const limit = Math.min(50, parseInt(sp.get('limit') || '10', 10))
        const sortKey = SORT_MAP[sp.get('sort')] ? sp.get('sort') : 'most_helpful'
        const callerId = await resolveCallerUserId()

        const baseProduct = new mongoose.Types.ObjectId(productId)

        const visibilityOr = [{ status: 'approved' }]
        if (callerId) visibilityOr.push({ user: new mongoose.Types.ObjectId(callerId) })

        const match = {
            product: baseProduct,
            deletedAt: null,
            $or: visibilityOr,
        }
        if (sortKey === 'with_photos') match['mediaUrls.0'] = { $exists: true }
        if (sortKey === 'verified') match.verifiedBuyer = true

        const reviews = await ReviewModel.aggregate([
            { $match: match },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userData' } },
            { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
            { $sort: SORT_MAP[sortKey] },
            { $skip: page * limit },
            { $limit: limit + 1 },
            {
                $project: {
                    _id: 1,
                    rating: 1,
                    title: 1,
                    review: 1,
                    mediaUrls: 1,
                    verifiedBuyer: 1,
                    status: 1,
                    helpfulCount: 1,
                    reply: 1,
                    createdAt: 1,
                    reviewedBy: '$userData.name',
                    avatar: '$userData.avatar',
                    isMine: callerId
                        ? { $eq: ['$user', new mongoose.Types.ObjectId(callerId)] }
                        : { $literal: false },
                    helpfulByMe: callerId
                        ? { $in: [new mongoose.Types.ObjectId(callerId), { $ifNull: ['$helpfulVoters', []] }] }
                        : { $literal: false },
                },
            },
        ])

        let nextPage = null
        if (reviews.length > limit) {
            reviews.pop()
            nextPage = page + 1
        }

        const totalApproved = await ReviewModel.countDocuments({
            product: baseProduct,
            deletedAt: null,
            status: 'approved',
        })

        return response(true, 200, 'Reviews fetched.', { reviews, nextPage, totalReview: totalApproved })
    } catch (error) {
        return catchError(error)
    }
}
