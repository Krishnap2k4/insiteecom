import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { appendMessage } from '@/lib/conversations'
import ContactSubmissionModel from '@/models/ContactSubmission.model'
import ConversationModel from '@/models/Conversation.model'
import UserModel from '@/models/User.model'
import { isValidObjectId } from 'mongoose'

/**
 * Convert a public contact submission into a Conversation. If the
 * email matches a known user we link to them; otherwise we leave
 * the conversation orphan-ish (subject + body only) — the team can
 * still reply via the customer's email.
 *
 * The submission row is kept (status → in_progress) with a back-ref
 * so we don't lose the raw signal.
 */
export async function POST(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const submission = await ContactSubmissionModel.findOne({ _id: id, deletedAt: null })
        if (!submission) return response(false, 404, 'Submission not found.')
        if (submission.conversation) {
            return response(false, 400, 'Already converted.', { conversation: String(submission.conversation) })
        }

        const linkedUser = await UserModel.findOne({ email: submission.email, deletedAt: null }).select('_id').lean()
        if (!linkedUser) {
            return response(false, 400, 'No customer account matches this email — reply via email instead.')
        }

        const conv = await ConversationModel.create({
            subject: submission.subject || 'Contact form enquiry',
            user: linkedUser._id,
            subjectType: 'general',
            status: 'open',
            priority: 'normal',
            adminUnread: false,
            customerUnread: false,
            lastMessageBy: 'customer',
            messagesCount: 0,
        })

        await appendMessage({
            conversation: conv._id,
            author: linkedUser._id,
            authorRole: 'customer',
            body: submission.message,
        })

        submission.conversation = conv._id
        submission.status = 'in_progress'
        submission.assignedTo = auth.userId
        await submission.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'contact.convert', entity: 'ContactSubmission', entityId: submission._id,
            meta: { conversationId: String(conv._id) },
        })

        return response(true, 200, 'Converted to ticket.', { conversation: String(conv._id) })
    } catch (error) {
        return catchError(error)
    }
}
