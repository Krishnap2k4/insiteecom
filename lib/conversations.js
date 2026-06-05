import ConversationModel from '@/models/Conversation.model'
import MessageModel from '@/models/Message.model'
import { logger } from '@/lib/logger'

/**
 * Append a message to a conversation atomically (well, eventually):
 *   1. Create the Message row
 *   2. Bump messagesCount, lastMessageAt, lastMessagePreview, lastMessageBy
 *   3. Flip the OTHER party's unread flag — but never the author's
 *   4. Move status back to `open` when it was `resolved`/`closed`
 *      and the customer just replied (the team should re-engage).
 *
 * Returns the created Message document.
 */
export const appendMessage = async ({
    conversation,
    author = null,
    authorRole,
    body,
    isInternal = false,
    attachments = [],
}) => {
    if (!conversation || !authorRole || !body) {
        throw new Error('conversation, authorRole, and body are required')
    }

    const conv = await ConversationModel.findById(conversation)
    if (!conv) throw new Error('Conversation not found')

    const msg = await MessageModel.create({
        conversation: conv._id,
        author,
        authorRole,
        body,
        isInternal,
        attachments,
        readByCustomer: authorRole === 'customer',
        readByAdmin: authorRole === 'admin' || authorRole === 'support' || isInternal,
    })

    if (!isInternal) {
        // Build a short preview from the body, stripped of HTML.
        const preview = String(body).replace(/<[^>]*>/g, '').trim().slice(0, 140)
        conv.lastMessagePreview = preview
        conv.lastMessageAt = new Date()
        conv.lastMessageBy = authorRole
        conv.messagesCount = (conv.messagesCount || 0) + 1

        if (authorRole === 'customer') {
            conv.adminUnread = true
            if (conv.status === 'resolved' || conv.status === 'closed') {
                conv.status = 'open'
                conv.closedAt = null
            }
        } else {
            conv.customerUnread = true
        }

        try {
            await conv.save()
        } catch (err) {
            logger.warn('conversation summary update failed', { conversation: String(conv._id), error: err?.message })
        }
    }

    return msg
}
