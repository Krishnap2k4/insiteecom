import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import ReturnModel from '@/models/Return.model'

/**
 * POST /api/account/returns/[id]/cancel — customer cancels their own
 * return/exchange request. Only allowed while still in `requested`
 * state (admin hasn't acted yet).
 */
export async function POST(_request, { params }) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const { id } = await params
        const doc = await ReturnModel.findOne({ _id: id, user: auth.userId, deletedAt: null })
        if (!doc) return response(false, 404, 'Return not found.')
        if (doc.status !== 'requested') {
            return response(false, 400, 'This request can no longer be cancelled.')
        }
        doc.status = 'cancelled'
        doc.completedAt = new Date()
        await doc.save()

        recordAudit({
            actor: auth.userId, actorRole: 'customer',
            action: 'return.cancelled',
            entity: 'Return', entityId: doc._id,
        })

        return response(true, 200, 'Request cancelled.')
    } catch (error) {
        return catchError(error)
    }
}
