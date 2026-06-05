import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Support conversation — a two-party thread between a customer and
 * the support team. Optionally linked to an order, return, or product
 * for context.
 *
 * `customerUnread` / `adminUnread` flip the moment the other party
 * sends a message; reading the thread flips them back. Stored on the
 * conversation so list views don't need a per-message subquery.
 *
 * `lastMessageAt` + `lastMessagePreview` are denormalised from the
 * latest Message so the inbox list can sort + preview without a
 * lookup.
 */
const conversationSchema = new mongoose.Schema({
    subject: { type: String, default: '', trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    subjectType: {
        type: String,
        enum: ['general', 'order', 'return', 'product'],
        default: 'general',
    },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    relatedReturn: { type: mongoose.Schema.Types.ObjectId, ref: 'Return', default: null },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },

    status: {
        type: String,
        enum: ['open', 'pending', 'resolved', 'closed'],
        default: 'open',
        index: true,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    tags: [{ type: String, trim: true }],

    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: '', trim: true },
    lastMessageBy: {
        type: String,
        enum: ['customer', 'admin', 'support', 'system'],
        default: 'customer',
    },

    customerUnread: { type: Boolean, default: false },
    adminUnread: { type: Boolean, default: true },

    messagesCount: { type: Number, default: 0, min: 0 },
    closedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

conversationSchema.index({ user: 1, lastMessageAt: -1 })
conversationSchema.index({ status: 1, lastMessageAt: -1 })

conversationSchema.plugin(softDeletePlugin)

const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema, 'conversations')
export default ConversationModel
