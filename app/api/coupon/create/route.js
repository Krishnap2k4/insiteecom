import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import CouponModel from '@/models/Coupon.model'
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const bodySchema = z.object({
    code: z.string().trim().min(3).max(40).transform((s) => s.toUpperCase()),
    description: z.string().trim().optional().default(''),
    discountType: z.enum(['percentage', 'fixed']).default('percentage'),
    discountValue: z.coerce.number().nonnegative(),
    maxDiscountAmount: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
    minOrderValue: z.coerce.number().nonnegative().optional().default(0),
    usageLimit: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
    usagePerUser: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
    applicableCategories: z.array(objectId).optional().default([]),
    applicableProducts: z.array(objectId).optional().default([]),
    excludedProducts: z.array(objectId).optional().default([]),
    customerGroups: z.array(objectId).optional().default([]),
    firstOrderOnly: z.coerce.boolean().optional().default(false),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date(),
    status: z.enum(['draft', 'active', 'paused', 'expired']).optional().default('active'),
    automatic: z.coerce.boolean().optional().default(false),
    stackable: z.coerce.boolean().optional().default(false),
    campaign: objectId.optional().nullable(),
})

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        if (data.discountType === 'percentage' && data.discountValue > 100) {
            return response(false, 400, 'Percentage discounts cannot exceed 100%.')
        }

        const doc = await CouponModel.create({
            ...data,
            startsAt: data.startsAt || new Date(),
            campaign: data.campaign || null,
        })

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'coupon.create', entity: 'Coupon', entityId: doc._id,
            meta: { code: doc.code },
        })

        return response(true, 200, 'Coupon added successfully.', { _id: String(doc._id) })
    } catch (error) {
        return catchError(error)
    }
}
