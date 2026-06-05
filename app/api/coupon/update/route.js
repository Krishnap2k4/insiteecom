import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import CouponModel from '@/models/Coupon.model'
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const bodySchema = z.object({
    _id: objectId,
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

export async function PUT(request) {
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

        const coupon = await CouponModel.findOne({ _id: data._id, deletedAt: null })
        if (!coupon) return response(false, 404, 'Coupon not found.')

        Object.assign(coupon, {
            code: data.code,
            description: data.description,
            discountType: data.discountType,
            discountValue: data.discountValue,
            maxDiscountAmount: data.maxDiscountAmount ?? null,
            minOrderValue: data.minOrderValue,
            usageLimit: data.usageLimit ?? null,
            usagePerUser: data.usagePerUser ?? null,
            applicableCategories: data.applicableCategories,
            applicableProducts: data.applicableProducts,
            excludedProducts: data.excludedProducts,
            customerGroups: data.customerGroups,
            firstOrderOnly: data.firstOrderOnly,
            startsAt: data.startsAt || coupon.startsAt || new Date(),
            endsAt: data.endsAt,
            status: data.status,
            automatic: data.automatic,
            stackable: data.stackable,
            campaign: data.campaign || null,
        })

        await coupon.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'coupon.update', entity: 'Coupon', entityId: coupon._id,
            meta: { code: coupon.code },
        })

        return response(true, 200, 'Coupon updated successfully.')
    } catch (error) {
        return catchError(error)
    }
}
