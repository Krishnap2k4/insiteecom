import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { isValidObjectId } from 'mongoose'
import ConversationModel from '@/models/Conversation.model'
import MessageModel from '@/models/Message.model'

/**
 * Customer view of a single conversation + its messages. Internal
 * admin notes are filtered out. Marks customer-unread = false after
 * fetching so the bell badge reconciles next refresh.
 */
export async function GET(_request, { params }) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const conv = await ConversationModel
            .findOne({ _id: id, user: auth.userId, deletedAt: null })
            .populate('relatedOrder', 'orderNumber totalAmount currency')
            .lean()
        if (!conv) return response(false, 404, 'Conversation not found.')

        const messages = await MessageModel
            .find({ conversation: conv._id, isInternal: false, deletedAt: null })
            .sort({ createdAt: 1 })
            .lean()

        // Best-effort read-receipt.
        if (conv.customerUnread || messages.some((m) => !m.readByCustomer && m.authorRole !== 'customer')) {
            await ConversationModel.updateOne({ _id: conv._id }, { $set: { customerUnread: false } })
            await MessageModel.updateMany(
                { conversation: conv._id, authorRole: { $ne: 'customer' }, readByCustomer: false },
                { $set: { readByCustomer: true } }
            )
        }

        return response(true, 200, 'Conversation fetched.', { conversation: conv, messages })
    } catch (error) {
        return catchError(error)
    }
}
