import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NotificationModel from '@/models/Notification.model'
import { z } from 'zod'

const bodySchema = z.object({
    ids: z.array(z.string()).optional(),
    all: z.boolean().optional(),
})

/**
 * POST — mark one, several, or all notifications read. The body
 * shape accepts either `{ ids: [...] }` or `{ all: true }`.
 */
export async function POST(request) {
    try {
        await connectDB()
        const cookieStore = await cookies()
        const access = cookieStore.get('access_token')
        if (!access?.value) return response(false, 401, 'Unauthorized.')
        let userId = null
        let role = null
        try {
            const { payload } = await jwtVerify(
                access.value,
                new TextEncoder().encode(process.env.SECRET_KEY),
            )
            userId = payload?._id
            role = payload?.role
        } catch {
            return response(false, 401, 'Unauthorized.')
        }
        if (!userId) return response(false, 401, 'Unauthorized.')

        const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
        if (!parsed.success) return response(false, 400, 'Invalid request.')

        const baseFilter = {
            user: userId,
            audienceRole: role === 'admin' ? 'admin' : 'user',
            read: false,
        }
        const filter = parsed.data.all
            ? baseFilter
            : { ...baseFilter, _id: { $in: parsed.data.ids || [] } }

        const result = await NotificationModel.updateMany(
            filter,
            { $set: { read: true, readAt: new Date() } },
        )
        return response(true, 200, 'Marked as read.', { matched: result.matchedCount, modified: result.modifiedCount })
    } catch (error) {
        return catchError(error)
    }
}
