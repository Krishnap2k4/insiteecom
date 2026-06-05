import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { logger } from '@/lib/logger'
import { DEFAULT_ROLES, PERMISSIONS } from '@/lib/permissionCatalog'
import CustomerGroupModel from '@/models/CustomerGroup.model'
import PermissionModel from '@/models/Permission.model'
import RoleModel from '@/models/Role.model'
import UserModel from '@/models/User.model'

/**
 * One-shot RBAC + customer-group seeder.
 *
 * Mirrors the in-code permission catalog into the Permission collection
 * (so the admin UI can render it from a single source), upserts the
 * default Role bundles, and ensures a `retail` CustomerGroup exists
 * as the default for new users.
 *
 * Side-effect: assigns the `admin` Role to every existing legacy admin
 * user (`User.role === 'admin'`) that doesn't already have any role
 * assignment. New routes that gate by permission can then check those
 * admins via `lib/permissions.js`.
 *
 * Idempotent — run as many times as you want. Documented in
 * PHASE1_NOTES.md with a curl example.
 */
export async function POST() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        // Permissions — upsert each code from the catalog.
        let permissionsCreated = 0
        let permissionsUpdated = 0
        for (const p of PERMISSIONS) {
            const existing = await PermissionModel.findOne({ code: p.code })
            if (existing) {
                let changed = false
                if (existing.name !== p.name) { existing.name = p.name; changed = true }
                if (existing.description !== p.description) { existing.description = p.description || ''; changed = true }
                if (existing.category !== p.category) { existing.category = p.category; changed = true }
                if (changed) {
                    await existing.save()
                    permissionsUpdated += 1
                }
            } else {
                await PermissionModel.create({
                    code: p.code,
                    name: p.name,
                    description: p.description || '',
                    category: p.category,
                    isSystem: true,
                })
                permissionsCreated += 1
            }
        }

        // Roles — create missing, sync permissions on existing system roles.
        // We deliberately KEEP user-added permissions on a system role
        // (i.e. only ADD missing codes, never remove) so an admin who
        // grants extra perms doesn't see them disappear on the next seed.
        let rolesCreated = 0
        let rolesUpdated = 0
        for (const r of DEFAULT_ROLES) {
            const existing = await RoleModel.findOne({ code: r.code })
            if (existing) {
                const current = new Set(existing.permissions || [])
                let changed = false
                for (const code of r.permissions) {
                    if (!current.has(code)) {
                        current.add(code)
                        changed = true
                    }
                }
                if (changed) {
                    existing.permissions = [...current]
                    await existing.save()
                    rolesUpdated += 1
                }
            } else {
                await RoleModel.create({
                    code: r.code,
                    name: r.name,
                    description: r.description,
                    permissions: r.permissions,
                    isSystem: r.isSystem,
                })
                rolesCreated += 1
            }
        }

        // Default customer group — `retail`. Created if missing.
        let customerGroupCreated = false
        let retailGroup = await CustomerGroupModel.findOne({ code: 'retail' })
        if (!retailGroup) {
            retailGroup = await CustomerGroupModel.create({
                code: 'retail',
                name: 'Retail',
                description: 'Default group for storefront customers.',
                discountPercent: 0,
                taxExempt: false,
                isDefault: true,
                isSystem: true,
            })
            customerGroupCreated = true
        }

        // Backfill: existing legacy admins get the admin role if they
        // haven't been assigned any role yet.
        const adminRole = await RoleModel.findOne({ code: 'admin' }).lean()
        let adminsAssigned = 0
        if (adminRole) {
            const legacyAdmins = await UserModel.find({
                role: 'admin',
                $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }],
            }).select('_id').lean()

            if (legacyAdmins.length > 0) {
                await UserModel.updateMany(
                    { _id: { $in: legacyAdmins.map((u) => u._id) } },
                    { $set: { roles: [adminRole._id] } }
                )
                adminsAssigned = legacyAdmins.length
            }
        }

        // Backfill: users without a customerGroup get assigned the retail one.
        const groupless = await UserModel.updateMany(
            { customerGroup: { $exists: false } },
            { $set: { customerGroup: retailGroup._id } }
        )

        const summary = {
            permissions: { created: permissionsCreated, updated: permissionsUpdated, total: PERMISSIONS.length },
            roles: { created: rolesCreated, updated: rolesUpdated, total: DEFAULT_ROLES.length },
            customerGroups: { created: customerGroupCreated ? 1 : 0 },
            users: {
                adminsAssignedRBAC: adminsAssigned,
                groupAssignedToCount: groupless?.modifiedCount ?? 0,
            },
        }

        logger.info('seed-rbac run complete', summary)

        return response(true, 200, 'RBAC seed complete.', summary)
    } catch (error) {
        return catchError(error)
    }
}
