import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ReviewModel from '@/models/Review.model'
import mongoose from 'mongoose'

/**
 * Public review summary for a product: total count, average rating,
 * per-rating distribution, percentage bars. Approved reviews only.
 */
export async function GET(request) {
    try {
        await connectDB()
        const productId = request.nextUrl.searchParams.get('productId')
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return response(false, 400, 'Product is missing.')
        }

        const grouped = await ReviewModel.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId),
                    deletedAt: null,
                    status: 'approved',
                },
            },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ])

        const totalReview = grouped.reduce((sum, r) => sum + r.count, 0)
        const averageRating = totalReview > 0
            ? (grouped.reduce((sum, r) => sum + r._id * r.count, 0) / totalReview).toFixed(1)
            : '0.0'

        const rating = {}
        const percentage = {}
        for (let i = 1; i <= 5; i += 1) {
            rating[i] = 0
            percentage[i] = 0
        }
        for (const g of grouped) {
            rating[g._id] = g.count
            percentage[g._id] = totalReview > 0 ? Math.round((g.count / totalReview) * 100) : 0
        }

        const withPhotos = await ReviewModel.countDocuments({
            product: new mongoose.Types.ObjectId(productId),
            deletedAt: null,
            status: 'approved',
            'mediaUrls.0': { $exists: true },
        })
        const verifiedCount = await ReviewModel.countDocuments({
            product: new mongoose.Types.ObjectId(productId),
            deletedAt: null,
            status: 'approved',
            verifiedBuyer: true,
        })

        return response(true, 200, 'Review details.', {
            totalReview,
            averageRating,
            rating,
            percentage,
            withPhotos,
            verifiedCount,
        })
    } catch (error) {
        return catchError(error)
    }
}
