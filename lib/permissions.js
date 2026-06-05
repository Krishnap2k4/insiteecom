import RoleModel from '@/models/Role.model'
import UserModel from '@/models/User.model'
import { connectDB } from './databaseConnection'
import { logger } from './logger'

/**
 * Permission resolution for a given user.
 *
 * Today, the legacy `User.role` string ('user' | 'admin') is still the
 * primary auth gate. This helper layers permission checks on top — when
 * a route opts in by calling `hasPermission(user, 'product.write')`,
 * the function reads the user's assigned `roles[]` (the new RBAC array),
 * collects the union of their permissions, and answers true/false.
 *
 * Special case: legacy admin users (`User.role === 'admin'`) who haven't
 * been migrated to RBAC yet are treated as having every permission. This
 * keeps the existing admin panel working until each module is migrated
 * to permission-gated routes.
 *
 * Permissions are cached per-request for the lifetime of the request
 * via a module-level Map keyed by userId. The cache resets on each
 * cold start; for cross-request caching we'll move to Redis in the
 * Platform/Phase-2 cache layer.
 */

const requestCacheKey = '__appPermissionRequestCache'

const getCache = () => {
    if (!globalThis[requestCacheKey]) {
        globalThis[requestCacheKey] = new Map()
    }
    return globalThis[requestCacheKey]
}

const TTL_MS = 30_000

export const invalidateUserPermissions = (userId) => {
    if (!userId) return
    getCache().delete(String(userId))
}

const loadPermissions = async (userId) => {
    await connectDB()
    const user = await UserModel.findById(userId)
        .select('role roles')
        .lean()
    if (!user) return { role: null, permissions: new Set() }

    if (!user.roles || user.roles.length === 0) {
        return { role: user.role, permissions: new Set() }
    }

    const roles = await RoleModel.find({
        _id: { $in: user.roles },
        deletedAt: null,
    }).select('permissions').lean()

    const permissions = new Set()
    for (const r of roles) {
        for (const p of r.permissions || []) {
            permissions.add(p)
        }
    }

    return { role: user.role, permissions }
}

/**
 * Returns true if the user has the given permission code.
 *
 * Pass either a userId (string/ObjectId) or a user-like object with
 * `_id` and optional `role`. Resolution falls back to a DB load when
 * the cache is cold.
 */
export const hasPermission = async (userOrId, permissionCode) => {
    if (!permissionCode) return false
    const userId = typeof userOrId === 'object' && userOrId !== null ? userOrId._id : userOrId
    if (!userId) return false

    const key = String(userId)
    const cache = getCache()
    const cached = cache.get(key)
    const now = Date.now()

    let resolved
    if (cached && cached.expiresAt > now) {
        resolved = cached.value
    } else {
        try {
            resolved = await loadPermissions(userId)
            cache.set(key, { value: resolved, expiresAt: now + TTL_MS })
        } catch (err) {
            logger.error('permission load failed', { userId: key, error: err })
            return false
        }
    }

    // Legacy admin gate — keep the old admin panel working until each
    // route opts in with its own permission code.
    if (resolved.role === 'admin') return true

    return resolved.permissions.has(permissionCode)
}

/**
 * Convenience for route handlers. Returns null on success (allowed)
 * or a NextResponse with 403 when the user lacks the permission.
 *
 *   const denied = await requirePermission(userId, 'order.refund')
 *   if (denied) return denied
 */
export const requirePermission = async (userOrId, permissionCode) => {
    const { response } = await import('./helperFunction')
    const allowed = await hasPermission(userOrId, permissionCode)
    if (allowed) return null
    return response(false, 403, 'You do not have permission to perform this action.')
}
