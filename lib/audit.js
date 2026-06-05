import AuditLogModel from '@/models/AuditLog.model'
import { logger } from './logger'

/**
 * Record an audit log entry. Fire-and-forget: a logging failure must
 * never block the primary operation that triggered it.
 *
 * Usage:
 *   await recordAudit({
 *       actor: userId, actorRole: 'admin',
 *       action: 'product.update', entity: 'Product', entityId: product._id,
 *       before, after, ip,
 *   })
 *
 * The action string is a free-form dotted identifier — pick stable names
 * since dashboards and alerts will key on them.
 */
export const recordAudit = ({
    actor,
    actorRole = 'system',
    action,
    entity,
    entityId,
    before,
    after,
    meta,
    ip,
    userAgent,
} = {}) => {
    if (!action || !entity) {
        logger.warn('audit skipped: action and entity required', { action, entity })
        return Promise.resolve(null)
    }

    return AuditLogModel.create({
        actor: actor || undefined,
        actorRole,
        action,
        entity,
        entityId: entityId || undefined,
        before,
        after,
        meta,
        ip,
        userAgent,
    }).catch((err) => {
        logger.error('audit write failed', { action, entity, error: err })
        return null
    })
}
