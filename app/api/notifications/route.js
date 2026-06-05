import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NotificationModel from '@/models/Notification.model'

/**
 * GET /api/notifications — current user's notifications, latest
 * first. Works for both customer and admin sessions — the row's
 * `audienceRole` segregates them via the cookie token.
 */
export async function GET(request) {
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

        const sp = request.nextUrl.searchParams
        const limit = Math.min(50, parseInt(sp.get('limit') || '20', 10))
        const onlyUnread = sp.get('unread') === '1'

        const filter = { user: userId, audienceRole: role === 'admin' ? 'admin' : 'user' }
        if (onlyUnread) filter.read = false

        const items = await NotificationModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()

        const unreadCount = await NotificationModel.countDocuments({
            ...filter,
            read: false,
        })

        return response(true, 200, 'Notifications fetched.', { items, unreadCount })
    } catch (error) {
        return catchError(error)
    }
}
