import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ReviewModel from '@/models/Review.model'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const sp = request.nextUrl.searchParams
        const start = parseInt(sp.get('start') || 0, 10)
        const size = parseInt(sp.get('size') || 10, 10)
        const filters = JSON.parse(sp.get('filters') || '[]')
        const globalFilter = sp.get('globalFilter') || ''
        const sorting = JSON.parse(sp.get('sorting') || '[]')
        const deleteType = sp.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') matchQuery = { deletedAt: null }
        else if (deleteType === 'PD') matchQuery = { deletedAt: { $ne: null } }

        if (globalFilter) {
            matchQuery.$or = [
                { 'productData.name': { $regex: globalFilter, $options: 'i' } },
                { 'userData.name': { $regex: globalFilter, $options: 'i' } },
                { title: { $regex: globalFilter, $options: 'i' } },
                { review: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        filters.forEach((filter) => {
            if (filter.id === 'product') matchQuery['productData.name'] = { $regex: filter.value, $options: 'i' }
            else if (filter.id === 'user') matchQuery['userData.name'] = { $regex: filter.value, $options: 'i' }
            else if (filter.id === 'rating') matchQuery.rating = Number(filter.value)
            else matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
        })

        const sortQuery = {}
        sorting.forEach((s) => { sortQuery[s.id] = s.desc ? -1 : 1 })

        const pipeline = [
            { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productData' } },
            { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userData' } },
            { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    _id: 1,
                    product: '$productData.name',
                    productSlug: '$productData.slug',
                    user: '$userData.name',
                    userEmail: '$userData.email',
                    rating: 1,
                    review: 1,
                    title: 1,
                    status: 1,
                    verifiedBuyer: 1,
                    reportedCount: 1,
                    helpfulCount: 1,
                    hasReply: { $cond: [{ $ifNull: ['$reply.text', false] }, true, false] },
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                },
            },
        ]

        const data = await ReviewModel.aggregate(pipeline)
        const totalRowCount = await ReviewModel.countDocuments(matchQuery)
        return NextResponse.json({ success: true, data, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
