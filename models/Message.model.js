import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * A single message inside a Conversation.
 *
 * `isInternal: true` means the message is an internal note from the
 * admin — never returned to the customer. The customer-facing APIs
 * filter these out; admin views see them with a distinct visual
 * treatment.
 *
 * `authorRole` is denormalised so list rendering doesn't need a
 * separate User lookup to know whether the message is from the
 * customer or the team.
 */
const attachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    name: { type: String, default: '' },
}, { _id: false })

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorRole: {
        type: String,
        enum: ['customer', 'admin', 'support', 'system'],
        required: true,
    },
    body: { type: String, required: true, trim: true },
    attachments: { type: [attachmentSchema], default: [] },

    isInternal: { type: Boolean, default: false, index: true },
    readByCustomer: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

messageSchema.index({ conversation: 1, createdAt: 1 })

messageSchema.plugin(softDeletePlugin)

const MessageModel = mongoose.models.Message || mongoose.model('Message', messageSchema, 'messages')
export default MessageModel
