import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { invalidateUserPermissions } from '@/lib/permissions'
import RoleModel from '@/models/Role.model'
import UserModel from '@/models/User.model'
import { z } from 'zod'

const roleCreateSchema = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers and underscores only.'),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(280).optional().default(''),
    permissions: z.array(z.string()).default([]),
})

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        await connectDB()

        const roles = await RoleModel
            .find({ deletedAt: null })
            .sort({ isSystem: -1, name: 1 })
            .lean()

        return response(true, 200, 'Roles fetched.', roles)
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        await connectDB()

        const payload = await request.json()
        const validate = roleCreateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const existing = await RoleModel.findOne({ code: validate.data.code, deletedAt: null }).lean()
        if (existing) {
            return response(false, 409, 'A role with this code already exists.')
        }

        const created = await RoleModel.create({
            ...validate.data,
            isSystem: false,
        })

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'role.create',
            entity: 'Role',
            entityId: created._id,
            after: created.toObject(),
        })

        // No users reference this role yet, so no cache invalidation needed.
        return response(true, 201, 'Role created.', created.toObject())
    } catch (error) {
        return catchError(error)
    }
}
