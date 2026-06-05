import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ConversationModel from '@/models/Conversation.model'

/**
 * Admin support inbox. Paginated + filterable list of every
 * conversation across all users. Lookup denormalised so the table
 * shows customer email + linked order without a per-row fetch.
 */
export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const sp = request.nextUrl.searchParams
        const start = parseInt(sp.get('start') || 0, 10)
        const size = parseInt(sp.get('size') || 10, 10)
        const globalFilter = sp.get('globalFilter') || ''
        const sorting = JSON.parse(sp.get('sorting') || '[]')
        const deleteType = sp.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') matchQuery = { deletedAt: null }
        else if (deleteType === 'PD') matchQuery = { deletedAt: { $ne: null } }

        if (globalFilter) {
            matchQuery.$or = [
                { subject: { $regex: globalFilter, $options: 'i' } },
                { lastMessagePreview: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
                { priority: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        const sortQuery = {}
        sorting.forEach((s) => { sortQuery[s.id] = s.desc ? -1 : 1 })

        const pipeline = [
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { lastMessageAt: -1 } },
            { $skip: start },
            { $limit: size },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $lookup: { from: 'orders', localField: 'relatedOrder', foreignField: '_id', as: 'orderDoc' } },
            {
                $project: {
                    subject: 1, status: 1, priority: 1, lastMessageAt: 1, lastMessagePreview: 1,
                    lastMessageBy: 1, adminUnread: 1, messagesCount: 1, subjectType: 1, createdAt: 1,
                    customerName: { $arrayElemAt: ['$userDoc.name', 0] },
                    customerEmail: { $arrayElemAt: ['$userDoc.email', 0] },
                    orderNumber: { $arrayElemAt: ['$orderDoc.orderNumber', 0] },
                    deletedAt: 1,
                },
            },
        ]
        const data = await ConversationModel.aggregate(pipeline)
        const totalRowCount = await ConversationModel.countDocuments(matchQuery)
        return NextResponse.json({ success: true, data, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
