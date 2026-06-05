import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import BrandModel from '@/models/Brand.model'
import { z } from 'zod'

const brandUpdateSchema = z.object({
    _id: z.string(),
    name: z.string().trim().min(2).max(80).optional(),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    logo: z.string().nullable().optional(),
    description: z.string().trim().max(2000).optional(),
    isActive: z.boolean().optional(),
    seo: z.object({
        title: z.string().trim().optional(),
        description: z.string().trim().optional(),
        canonical: z.string().trim().optional(),
    }).optional(),
})

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const validate = brandUpdateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const { _id, ...data } = validate.data
        const brand = await BrandModel.findOne({ _id, deletedAt: null })
        if (!brand) return response(false, 404, 'Brand not found.')

        const before = brand.toObject()

        if (data.slug && data.slug !== brand.slug) {
            const conflict = await BrandModel.findOne({ slug: data.slug, _id: { $ne: _id }, deletedAt: null }).lean()
            if (conflict) return response(false, 409, 'Another brand already uses this slug.')
        }

        Object.assign(brand, data)
        await brand.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'brand.update',
            entity: 'Brand',
            entityId: brand._id,
            before,
            after: brand.toObject(),
        })

        return response(true, 200, 'Brand updated successfully.')
    } catch (error) {
        return catchError(error)
    }
}
