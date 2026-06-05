import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ContactSubmissionModel from '@/models/ContactSubmission.model'

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
                { name: { $regex: globalFilter, $options: 'i' } },
                { email: { $regex: globalFilter, $options: 'i' } },
                { subject: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        const sortQuery = {}
        sorting.forEach((s) => { sortQuery[s.id] = s.desc ? -1 : 1 })

        const pipeline = [
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            { $project: { name: 1, email: 1, phone: 1, subject: 1, status: 1, createdAt: 1, conversation: 1, deletedAt: 1 } },
        ]
        const data = await ContactSubmissionModel.aggregate(pipeline)
        const totalRowCount = await ContactSubmissionModel.countDocuments(matchQuery)
        return NextResponse.json({ success: true, data, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
