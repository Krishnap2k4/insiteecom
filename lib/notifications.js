import NotificationModel from '@/models/Notification.model'
import UserModel from '@/models/User.model'
import { logger } from '@/lib/logger'

/**
 * Best-effort notification emit. Storage failures are logged and
 * swallowed — emitting a notification should never break the
 * underlying flow that triggered it.
 */
export const emitNotification = async ({
    user,
    audienceRole = 'user',
    type = 'system',
    title,
    body = '',
    actionUrl = '',
    entityType = '',
    entityId = null,
}) => {
    if (!user || !title) return null
    try {
        return await NotificationModel.create({
            user,
            audienceRole,
            type,
            title,
            body,
            actionUrl,
            relatedEntity: { entityType, entityId },
        })
    } catch (err) {
        logger.warn('notification emit failed', { user: String(user), type, error: err?.message })
        return null
    }
}

/**
 * Fan out a notification to every admin user. Used for events the
 * support team should react to (new ticket, new contact submission).
 * One DB lookup + a bulk insert — capped at the first 50 admins
 * because in practice teams aren't bigger than that.
 */
export const emitAdminBroadcast = async ({ title, body = '', actionUrl = '', type = 'system', entityType = '', entityId = null }) => {
    if (!title) return null
    try {
        const admins = await UserModel
            .find({ role: 'admin', deletedAt: null })
            .select('_id')
            .limit(50)
            .lean()
        if (admins.length === 0) return null
        const rows = admins.map((a) => ({
            user: a._id,
            audienceRole: 'admin',
            type,
            title,
            body,
            actionUrl,
            relatedEntity: { entityType, entityId },
        }))
        return await NotificationModel.insertMany(rows, { ordered: false })
    } catch (err) {
        logger.warn('admin notification broadcast failed', { title, error: err?.message })
        return null
    }
}
