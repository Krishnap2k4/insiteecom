import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import InventoryModel from '@/models/Inventory.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const adjustSchema = z.object({
    mode: z.enum(['set', 'delta']),
    quantity: z.coerce.number().int(),
    reorderLevel: z.coerce.number().int().min(0).optional(),
    backorderable: z.boolean().optional(),
    reason: z.string().trim().max(280).optional().default(''),
})

/**
 * Adjust stock for an Inventory row.
 *
 *   mode='set'   → absolute quantity = <quantity>
 *   mode='delta' → quantity += <quantity> (negative subtracts)
 *
 * Quantity is floor-clamped at 0. Audit log captures before/after +
 * the optional reason so we can trace stock movements later.
 */
export async function POST(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        await connectDB()

        const payload = await request.json()
        const validate = adjustSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const row = await InventoryModel.findOne({ _id: id, deletedAt: null })
        if (!row) return response(false, 404, 'Inventory row not found.')

        const before = {
            quantity: row.quantity,
            reorderLevel: row.reorderLevel,
            backorderable: row.backorderable,
        }

        const next = validate.data.mode === 'set'
            ? validate.data.quantity
            : (row.quantity || 0) + validate.data.quantity
        row.quantity = Math.max(0, next)

        if (validate.data.reorderLevel !== undefined) row.reorderLevel = validate.data.reorderLevel
        if (validate.data.backorderable !== undefined) row.backorderable = validate.data.backorderable

        await row.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'inventory.adjust',
            entity: 'Inventory',
            entityId: row._id,
            before,
            after: {
                quantity: row.quantity,
                reorderLevel: row.reorderLevel,
                backorderable: row.backorderable,
            },
            meta: { mode: validate.data.mode, reason: validate.data.reason },
        })

        return response(true, 200, 'Stock updated.', { _id: row._id, quantity: row.quantity })
    } catch (error) {
        return catchError(error)
    }
}
