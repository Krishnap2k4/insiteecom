import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import BrandModel from "@/models/Brand.model"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

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
            matchQuery['$or'] = [
                { name: { $regex: globalFilter, $options: 'i' } },
                { slug: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        for (const filter of filters) {
            matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
        }

        let sortQuery = {}
        for (const sort of sorting) sortQuery[sort.id] = sort.desc ? -1 : 1

        const pipeline = [
            {
                $lookup: {
                    from: 'products',
                    let: { brandId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$brand', '$$brandId'] }, deletedAt: null } },
                        { $count: 'count' },
                    ],
                    as: 'productStats',
                },
            },
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    isActive: 1,
                    isSystem: 1,
                    productCount: { $ifNull: [{ $arrayElemAt: ['$productStats.count', 0] }, 0] },
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                },
            },
        ]

        const brands = await BrandModel.aggregate(pipeline)
        const totalRowCount = await BrandModel.countDocuments(matchQuery)

        return NextResponse.json({ success: true, data: brands, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
