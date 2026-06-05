import mongoose from 'mongoose'

/**
 * In-app notification. The storefront header bell polls
 * `/api/notifications/unread-count`; the dropdown reads the recent
 * list via `/api/notifications`. Admin notifications follow the same
 * model — `audienceRole` decides who can see it.
 *
 * `relatedEntity` is a generic backref so we don't add a column per
 * entity type. Each emitter picks a stable string for `entityType`.
 *
 * TTL: read notifications older than 90 days are auto-pruned so the
 * collection doesn't grow without bound.
 */
const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    audienceRole: {
        // 'user' notifications target a specific customer.
        // 'admin' notifications target any admin (typically broadcast).
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        index: true,
    },
    type: {
        // Free-form-ish bucket so the UI can pick an icon / colour.
        type: String,
        enum: ['order', 'return', 'message', 'system', 'promo', 'shipment', 'refund'],
        default: 'system',
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    actionUrl: { type: String, default: '' },
    relatedEntity: {
        entityType: { type: String, default: '' },
        entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
}, { timestamps: true })

notificationSchema.index({ user: 1, read: 1, createdAt: -1 })

// Auto-prune notifications older than 90 days — we never delete
// unread ones (Mongo's TTL fires per-doc on the indexed field, so we
// use `readAt` rather than `createdAt`).
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema, 'notifications')
export default NotificationModel
