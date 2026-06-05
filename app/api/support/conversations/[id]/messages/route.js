import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { appendMessage } from '@/lib/conversations'
import { emitAdminBroadcast } from '@/lib/notifications'
import ConversationModel from '@/models/Conversation.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const bodySchema = z.object({
    body: z.string().trim().min(1).max(5000),
})

/**
 * Customer adds a message to their own conversation. Re-opens the
 * thread if the team had previously closed it.
 */
export async function POST(request, { params }) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Message body is required.', { issues: parsed.error.issues })
        }

        const conv = await ConversationModel.findOne({ _id: id, user: auth.userId, deletedAt: null })
        if (!conv) return response(false, 404, 'Conversation not found.')

        const msg = await appendMessage({
            conversation: conv._id,
            author: auth.userId,
            authorRole: 'customer',
            body: parsed.data.body,
        })

        emitAdminBroadcast({
            type: 'message',
            title: 'New customer reply',
            body: conv.subject || parsed.data.body.slice(0, 80),
            actionUrl: `/admin/support/${conv._id}`,
            entityType: 'Conversation',
            entityId: conv._id,
        })

        return response(true, 200, 'Message sent.', { _id: String(msg._id) })
    } catch (error) {
        return catchError(error)
    }
}
