import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ShipmentModel from '@/models/Shipment.model'

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const searchParams = request.nextUrl.searchParams
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 10, 10)
        const globalFilter = searchParams.get('globalFilter') || ''
        const sorting = JSON.parse(searchParams.get('sorting') || '[]')

        const matchQuery = { deletedAt: null }
        if (globalFilter) {
            matchQuery.$or = [
                { carrier: { $regex: globalFilter, $options: 'i' } },
                { trackingNumber: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        const sortQuery = {}
        sorting.forEach((s) => { sortQuery[s.id] = s.desc ? -1 : 1 })

        const rows = await ShipmentModel.aggregate([
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'orderDoc' } },
            {
                $project: {
                    carrier: 1, trackingNumber: 1, trackingUrl: 1, status: 1,
                    items: 1, shippedAt: 1, deliveredAt: 1, createdAt: 1,
                    orderNumber: { $arrayElemAt: ['$orderDoc.orderNumber', 0] },
                    orderLegacyId: { $arrayElemAt: ['$orderDoc.order_id', 0] },
                },
            },
        ])
        const totalRowCount = await ShipmentModel.countDocuments(matchQuery)
        return NextResponse.json({ success: true, data: rows, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
