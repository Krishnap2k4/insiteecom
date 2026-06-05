import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { sendReturnReceived } from '@/lib/orderEmails'
import OrderModel from '@/models/Order.model'
import ReturnModel from '@/models/Return.model'

/**
 * POST — admin acknowledges the returned items have arrived back at
 * the warehouse. Moves status `approved → received`. After this the
 * admin issues a refund (return) or creates a replacement shipment
 * (exchange).
 */
export async function POST(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const doc = await ReturnModel.findById(id)
        if (!doc) return response(false, 404, 'Return not found.')
        if (doc.status !== 'approved') {
            return response(false, 400, `Can only mark received when status is approved (currently ${doc.status}).`)
        }
        doc.status = 'received'
        doc.receivedAt = new Date()
        await doc.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'return.received',
            entity: 'Return', entityId: doc._id,
        })

        const order = await OrderModel.findById(doc.order).lean()
        if (order) sendReturnReceived(doc.toObject(), order)

        return response(true, 200, 'Return marked as received.', { status: doc.status })
    } catch (error) {
        return catchError(error)
    }
}
