import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import CustomerGroupModel from '@/models/CustomerGroup.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const groupUpdateSchema = z.object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(280).optional(),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
    taxExempt: z.boolean().optional(),
    isDefault: z.boolean().optional(),
})

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid id.')
        }
        await connectDB()
        const group = await CustomerGroupModel.findOne({ _id: id, deletedAt: null }).lean()
        if (!group) {
            return response(false, 404, 'Customer group not found.')
        }
        return response(true, 200, 'Customer group fetched.', group)
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
            return response(false, 400, 'Invalid id.')
        }
        await connectDB()

        const payload = await request.json()
        const validate = groupUpdateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const group = await CustomerGroupModel.findOne({ _id: id, deletedAt: null })
        if (!group) {
            return response(false, 404, 'Customer group not found.')
        }

        const before = group.toObject()
        const data = validate.data

        if (data.isDefault === true && !group.isDefault) {
            await CustomerGroupModel.updateMany(
                { _id: { $ne: group._id }, isDefault: true, deletedAt: null },
                { $set: { isDefault: false } }
            )
        }

        if (data.name !== undefined) group.name = data.name
        if (data.description !== undefined) group.description = data.description
        if (data.discountPercent !== undefined) group.discountPercent = data.discountPercent
        if (data.taxExempt !== undefined) group.taxExempt = data.taxExempt
        if (data.isDefault !== undefined) group.isDefault = data.isDefault

        await group.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'customer-group.update',
            entity: 'CustomerGroup',
            entityId: group._id,
            before,
            after: group.toObject(),
        })

        return response(true, 200, 'Customer group updated.', group.toObject())
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
            return response(false, 400, 'Invalid id.')
        }
        await connectDB()
        const group = await CustomerGroupModel.findOne({ _id: id, deletedAt: null })
        if (!group) {
            return response(false, 404, 'Customer group not found.')
        }
        if (group.isSystem) {
            return response(false, 400, 'System groups cannot be deleted.')
        }
        group.deletedAt = new Date()
        await group.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'customer-group.delete',
            entity: 'CustomerGroup',
            entityId: group._id,
        })

        return response(true, 200, 'Customer group deleted.')
    } catch (error) {
        return catchError(error)
    }
}
