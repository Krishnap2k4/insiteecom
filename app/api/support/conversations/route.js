import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { appendMessage } from '@/lib/conversations'
import { emitAdminBroadcast } from '@/lib/notifications'
import ConversationModel from '@/models/Conversation.model'
import OrderModel from '@/models/Order.model'
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

/**
 * GET — customer's own conversations.
 */
export async function GET() {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const list = await ConversationModel
            .find({ user: auth.userId, deletedAt: null })
            .populate('relatedOrder', 'orderNumber')
            .sort({ lastMessageAt: -1 })
            .lean()

        const shaped = list.map((c) => ({
            _id: String(c._id),
            subject: c.subject,
            status: c.status,
            priority: c.priority,
            lastMessageAt: c.lastMessageAt,
            lastMessagePreview: c.lastMessagePreview,
            lastMessageBy: c.lastMessageBy,
            customerUnread: c.customerUnread,
            messagesCount: c.messagesCount,
            subjectType: c.subjectType,
            relatedOrder: c.relatedOrder ? {
                _id: String(c.relatedOrder._id),
                orderNumber: c.relatedOrder.orderNumber,
            } : null,
            createdAt: c.createdAt,
        }))
        return response(true, 200, 'Conversations fetched.', shaped)
    } catch (error) {
        return catchError(error)
    }
}

/**
 * POST — customer starts a new conversation, optionally linked to
 * an order they own. The first message goes in the same call.
 */
const createSchema = z.object({
    subject: z.string().trim().min(2).max(120),
    body: z.string().trim().min(1).max(5000),
    relatedOrder: objectId.optional(),
    relatedReturn: objectId.optional(),
    relatedProduct: objectId.optional(),
    subjectType: z.enum(['general', 'order', 'return', 'product']).optional(),
})

export async function POST(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const payload = await request.json()
        const parsed = createSchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        // Confirm the order belongs to the user before linking.
        let linkedOrder = null
        if (data.relatedOrder) {
            linkedOrder = await OrderModel.findOne({ _id: data.relatedOrder, user: auth.userId, deletedAt: null }).lean()
            if (!linkedOrder) return response(false, 404, 'Order not found.')
        }

        const conv = await ConversationModel.create({
            subject: data.subject,
            user: auth.userId,
            subjectType: data.subjectType || (linkedOrder ? 'order' : 'general'),
            relatedOrder: linkedOrder?._id || null,
            relatedReturn: data.relatedReturn || null,
            relatedProduct: data.relatedProduct || null,
            status: 'open',
            priority: 'normal',
            adminUnread: true,
            customerUnread: false,
            lastMessageAt: new Date(),
            lastMessagePreview: data.body.slice(0, 140),
            lastMessageBy: 'customer',
            messagesCount: 0,
        })

        await appendMessage({
            conversation: conv._id,
            author: auth.userId,
            authorRole: 'customer',
            body: data.body,
        })

        emitAdminBroadcast({
            type: 'message',
            title: 'New support conversation',
            body: data.subject,
            actionUrl: `/admin/support/${conv._id}`,
            entityType: 'Conversation',
            entityId: conv._id,
        })

        return response(true, 200, 'Conversation started.', { _id: String(conv._id) })
    } catch (error) {
        return catchError(error)
    }
}
