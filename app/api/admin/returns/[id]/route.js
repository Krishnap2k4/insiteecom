import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { sendReturnApproved, sendReturnRejected } from '@/lib/orderEmails'
import { emitNotification } from '@/lib/notifications'
import OrderModel from '@/models/Order.model'
import ReturnModel from '@/models/Return.model'
import { z } from 'zod'

/**
 * GET — full return detail (admin view).
 * PUT — approve or reject a request. Sends the matching email.
 */
export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const or = [{ returnNumber: String(id).toUpperCase() }]
        if (/^[0-9a-fA-F]{24}$/.test(id)) or.push({ _id: id })

        const doc = await ReturnModel
            .findOne({ $or: or, deletedAt: null })
            .populate({ path: 'order', select: 'orderNumber email totalAmount currency shippingAddress paymentMethod paymentStatus fulfillmentStatus items createdAt' })
            .populate({ path: 'user', select: 'name email' })
            .lean()
        if (!doc) return response(false, 404, 'Return not found.')
        return response(true, 200, 'Return found.', doc)
    } catch (error) {
        return catchError(error)
    }
}

const decisionSchema = z.object({
    action: z.enum(['approve', 'reject']),
    adminNote: z.string().optional().default(''),
})

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = decisionSchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { action, adminNote } = parsed.data

        const { id } = await params
        const doc = await ReturnModel.findById(id)
        if (!doc) return response(false, 404, 'Return not found.')
        if (doc.status !== 'requested') {
            return response(false, 400, `This request is already ${doc.status}.`)
        }

        if (action === 'approve') {
            doc.status = 'approved'
            doc.approvedAt = new Date()
        } else {
            doc.status = 'rejected'
            doc.completedAt = new Date()
        }
        if (adminNote) doc.adminNote = adminNote
        await doc.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: `return.${action}`,
            entity: 'Return', entityId: doc._id,
        })

        const order = await OrderModel.findById(doc.order).lean()
        if (order) {
            if (action === 'approve') sendReturnApproved(doc.toObject(), order)
            else sendReturnRejected(doc.toObject(), order)
            if (doc.user) {
                emitNotification({
                    user: doc.user,
                    type: 'return',
                    title: `Return ${action === 'approve' ? 'approved' : 'not approved'}`,
                    body: doc.returnNumber,
                    actionUrl: `/returns/${doc.returnNumber}`,
                    entityType: 'Return',
                    entityId: doc._id,
                })
            }
        }

        return response(true, 200, action === 'approve' ? 'Return approved.' : 'Return rejected.', {
            status: doc.status,
        })
    } catch (error) {
        return catchError(error)
    }
}
