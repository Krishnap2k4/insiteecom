import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import SubscriberModel from '@/models/Subscriber.model'

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const list = await SubscriberModel
            .find({ deletedAt: null })
            .select('email name source status verifiedAt createdAt')
            .sort({ createdAt: -1 })
            .lean()
        const rows = list.map((s) => ({
            email: s.email,
            name: s.name || '',
            source: s.source || '',
            status: s.status,
            verifiedAt: s.verifiedAt ? new Date(s.verifiedAt).toISOString() : '',
            subscribedAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
        }))
        return response(true, 200, 'Subscribers exported.', rows)
    } catch (error) {
        return catchError(error)
    }
}
