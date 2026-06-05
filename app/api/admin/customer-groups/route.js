import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import CustomerGroupModel from '@/models/CustomerGroup.model'
import { z } from 'zod'

const groupCreateSchema = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers and underscores only.'),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(280).optional().default(''),
    discountPercent: z.coerce.number().min(0).max(100).default(0),
    taxExempt: z.boolean().default(false),
    isDefault: z.boolean().default(false),
})

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        await connectDB()

        const groups = await CustomerGroupModel
            .find({ deletedAt: null })
            .sort({ isDefault: -1, name: 1 })
            .lean()

        return response(true, 200, 'Customer groups fetched.', groups)
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
        const validate = groupCreateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const exists = await CustomerGroupModel.findOne({ code: validate.data.code, deletedAt: null }).lean()
        if (exists) {
            return response(false, 409, 'A group with this code already exists.')
        }

        if (validate.data.isDefault) {
            await CustomerGroupModel.updateMany(
                { isDefault: true, deletedAt: null },
                { $set: { isDefault: false } }
            )
        }

        const created = await CustomerGroupModel.create(validate.data)

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'customer-group.create',
            entity: 'CustomerGroup',
            entityId: created._id,
            after: created.toObject(),
        })

        return response(true, 201, 'Customer group created.', created.toObject())
    } catch (error) {
        return catchError(error)
    }
}
