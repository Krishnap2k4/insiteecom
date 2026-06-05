import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NotificationModel from '@/models/Notification.model'

/**
 * Lightweight endpoint the header bell polls. Authoritative count
 * even when the list endpoint hasn't been hit yet.
 */
export async function GET() {
    try {
        await connectDB()
        const cookieStore = await cookies()
        const access = cookieStore.get('access_token')
        if (!access?.value) return response(true, 200, 'Unauthorized.', { unreadCount: 0 })

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
            return response(true, 200, 'Unauthorized.', { unreadCount: 0 })
        }
        if (!userId) return response(true, 200, 'Unauthorized.', { unreadCount: 0 })

        const unreadCount = await NotificationModel.countDocuments({
            user: userId,
            audienceRole: role === 'admin' ? 'admin' : 'user',
            read: false,
        })
        return response(true, 200, 'Count fetched.', { unreadCount })
    } catch (error) {
        return catchError(error)
    }
}
