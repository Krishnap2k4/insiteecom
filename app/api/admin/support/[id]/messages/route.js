import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { appendMessage } from '@/lib/conversations'
import { emitNotification } from '@/lib/notifications'
import ConversationModel from '@/models/Conversation.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const bodySchema = z.object({
    body: z.string().trim().min(1).max(5000),
    isInternal: z.boolean().optional().default(false),
})

/**
 * Admin replies (or leaves an internal note) on a conversation.
 * Internal notes don't appear to the customer and don't update
 * lastMessage / customerUnread.
 */
export async function POST(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Message body is required.', { issues: parsed.error.issues })
        }

        const conv = await ConversationModel.findOne({ _id: id, deletedAt: null })
        if (!conv) return response(false, 404, 'Conversation not found.')

        const msg = await appendMessage({
            conversation: conv._id,
            author: auth.userId,
            authorRole: 'admin',
            body: parsed.data.body,
            isInternal: parsed.data.isInternal,
        })

        if (!parsed.data.isInternal) {
            emitNotification({
                user: conv.user,
                type: 'message',
                title: 'New reply from support',
                body: conv.subject || parsed.data.body.slice(0, 80),
                actionUrl: `/account/messages/${conv._id}`,
                entityType: 'Conversation',
                entityId: conv._id,
            })
        }

        return response(true, 200, 'Message sent.', { _id: String(msg._id) })
    } catch (error) {
        return catchError(error)
    }
}
