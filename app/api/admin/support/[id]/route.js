import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import ConversationModel from '@/models/Conversation.model'
import MessageModel from '@/models/Message.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const patchSchema = z.object({
    status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assignedTo: z.union([objectId, z.null()]).optional(),
    tags: z.array(z.string().trim()).optional(),
})

/**
 * Admin view of a single conversation. Includes EVERY message —
 * internal notes too. Marks adminUnread=false on fetch.
 */
export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const conv = await ConversationModel
            .findOne({ _id: id, deletedAt: null })
            .populate('user', 'name email')
            .populate('assignedTo', 'name email')
            .populate('relatedOrder', 'orderNumber totalAmount currency')
            .lean()
        if (!conv) return response(false, 404, 'Conversation not found.')

        const messages = await MessageModel
            .find({ conversation: conv._id, deletedAt: null })
            .populate('author', 'name email role')
            .sort({ createdAt: 1 })
            .lean()

        if (conv.adminUnread || messages.some((m) => m.authorRole === 'customer' && !m.readByAdmin)) {
            await ConversationModel.updateOne({ _id: conv._id }, { $set: { adminUnread: false } })
            await MessageModel.updateMany(
                { conversation: conv._id, authorRole: 'customer', readByAdmin: false },
                { $set: { readByAdmin: true } }
            )
        }

        return response(true, 200, 'Conversation fetched.', { conversation: conv, messages })
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const payload = await request.json()
        const parsed = patchSchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid update.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        const conv = await ConversationModel.findOne({ _id: id, deletedAt: null })
        if (!conv) return response(false, 404, 'Conversation not found.')

        if (data.status !== undefined) {
            conv.status = data.status
            if (data.status === 'resolved' || data.status === 'closed') {
                conv.closedAt = new Date()
            } else {
                conv.closedAt = null
            }
        }
        if (data.priority !== undefined) conv.priority = data.priority
        if (data.assignedTo !== undefined) conv.assignedTo = data.assignedTo || null
        if (data.tags !== undefined) conv.tags = data.tags

        await conv.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'conversation.update', entity: 'Conversation', entityId: conv._id,
            meta: data,
        })

        return response(true, 200, 'Conversation updated.', {
            status: conv.status, priority: conv.priority,
        })
    } catch (error) {
        return catchError(error)
    }
}
