import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import CouponModel from '@/models/Coupon.model'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()

        const searchParams = request.nextUrl.searchParams
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 10, 10)
        const filters = JSON.parse(searchParams.get('filters') || '[]')
        const globalFilter = searchParams.get('globalFilter') || ''
        const sorting = JSON.parse(searchParams.get('sorting') || '[]')
        const deleteType = searchParams.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') matchQuery = { deletedAt: null }
        else if (deleteType === 'PD') matchQuery = { deletedAt: { $ne: null } }

        if (globalFilter) {
            matchQuery.$or = [
                { code: { $regex: globalFilter, $options: 'i' } },
                { description: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
                { discountType: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        filters.forEach((filter) => {
            if (['minOrderValue', 'discountValue', 'usageLimit', 'usageCount'].includes(filter.id)) {
                matchQuery[filter.id] = Number(filter.value)
            } else if (filter.id === 'endsAt' || filter.id === 'startsAt') {
                matchQuery[filter.id] = new Date(filter.value)
            } else {
                matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
            }
        })

        const sortQuery = {}
        sorting.forEach((s) => { sortQuery[s.id] = s.desc ? -1 : 1 })

        const pipeline = [
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    _id: 1,
                    code: 1,
                    description: 1,
                    discountType: 1,
                    discountValue: { $ifNull: ['$discountValue', '$discountPercentage'] },
                    minOrderValue: { $ifNull: ['$minOrderValue', '$minShoppingAmount'] },
                    usageLimit: 1,
                    usageCount: 1,
                    usagePerUser: 1,
                    startsAt: 1,
                    endsAt: { $ifNull: ['$endsAt', '$validity'] },
                    status: 1,
                    automatic: 1,
                    firstOrderOnly: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                },
            },
        ]

        const data = await CouponModel.aggregate(pipeline)
        const totalRowCount = await CouponModel.countDocuments(matchQuery)
        return NextResponse.json({ success: true, data, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
