import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { invalidateUserPermissions } from '@/lib/permissions'
import RoleModel from '@/models/Role.model'
import UserModel from '@/models/User.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const roleUpdateSchema = z.object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(280).optional(),
    permissions: z.array(z.string()).optional(),
})

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid role id.')
        }

        await connectDB()
        const role = await RoleModel.findOne({ _id: id, deletedAt: null }).lean()
        if (!role) {
            return response(false, 404, 'Role not found.')
        }

        return response(true, 200, 'Role fetched.', role)
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid role id.')
        }

        await connectDB()

        const payload = await request.json()
        const validate = roleUpdateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const role = await RoleModel.findOne({ _id: id, deletedAt: null })
        if (!role) {
            return response(false, 404, 'Role not found.')
        }

        const before = role.toObject()
        const { name, description, permissions } = validate.data
        if (name !== undefined) role.name = name
        if (description !== undefined) role.description = description
        if (permissions !== undefined) role.permissions = permissions
        await role.save()

        // Invalidate permission cache for every user with this role.
        const usersWithRole = await UserModel.find({ roles: role._id }).select('_id').lean()
        for (const u of usersWithRole) invalidateUserPermissions(u._id)

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'role.update',
            entity: 'Role',
            entityId: role._id,
            before,
            after: role.toObject(),
        })

        return response(true, 200, 'Role updated.', role.toObject())
    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid role id.')
        }

        await connectDB()
        const role = await RoleModel.findOne({ _id: id, deletedAt: null })
        if (!role) {
            return response(false, 404, 'Role not found.')
        }

        if (role.isSystem) {
            return response(false, 400, 'System roles cannot be deleted.')
        }

        // Unassign this role from any user that has it.
        await UserModel.updateMany(
            { roles: role._id },
            { $pull: { roles: role._id } }
        )

        role.deletedAt = new Date()
        await role.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'role.delete',
            entity: 'Role',
            entityId: role._id,
        })

        return response(true, 200, 'Role deleted.')
    } catch (error) {
        return catchError(error)
    }
}
