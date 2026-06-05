import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import OrderModel from '@/models/Order.model'
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
                { orderNumber: { $regex: globalFilter, $options: 'i' } },
                { order_id: { $regex: globalFilter, $options: 'i' } },
                { payment_id: { $regex: globalFilter, $options: 'i' } },
                { email: { $regex: globalFilter, $options: 'i' } },
                { 'shippingAddress.fullName': { $regex: globalFilter, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: globalFilter, $options: 'i' } },
                { name: { $regex: globalFilter, $options: 'i' } },
                { phone: { $regex: globalFilter, $options: 'i' } },
                { paymentStatus: { $regex: globalFilter, $options: 'i' } },
                { fulfillmentStatus: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
            ]
        }

        filters.forEach((filter) => {
            matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
        })

        const sortQuery = {}
        sorting.forEach((sort) => { sortQuery[sort.id] = sort.desc ? -1 : 1 })

        const pipeline = [
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    orderNumber: 1,
                    order_id: 1, // legacy
                    payment_id: 1, // legacy
                    email: 1,
                    name: { $ifNull: ['$shippingAddress.fullName', '$name'] },
                    phone: { $ifNull: ['$shippingAddress.phone', '$phone'] },
                    totalAmount: 1,
                    currency: 1,
                    paymentStatus: 1,
                    fulfillmentStatus: 1,
                    status: 1,
                    itemCount: { $size: { $ifNull: ['$items', []] } },
                    createdAt: 1,
                    deletedAt: 1,
                },
            },
        ]

        const getOrders = await OrderModel.aggregate(pipeline)
        const totalRowCount = await OrderModel.countDocuments(matchQuery)

        return NextResponse.json({ success: true, data: getOrders, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
