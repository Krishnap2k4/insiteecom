import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import BrandModel from '@/models/Brand.model'
import { z } from 'zod'

const brandSchema = z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.'),
    logo: z.string().nullable().optional(),
    description: z.string().trim().max(2000).optional().default(''),
    isActive: z.boolean().optional().default(true),
    seo: z.object({
        title: z.string().trim().optional(),
        description: z.string().trim().optional(),
        canonical: z.string().trim().optional(),
    }).optional(),
})

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const validate = brandSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const exists = await BrandModel.findOne({ slug: validate.data.slug, deletedAt: null }).lean()
        if (exists) {
            return response(false, 409, 'A brand with this slug already exists.')
        }

        const brand = await BrandModel.create(validate.data)

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'brand.create',
            entity: 'Brand',
            entityId: brand._id,
            after: brand.toObject(),
        })

        return response(true, 201, 'Brand added successfully.', { _id: brand._id })
    } catch (error) {
        return catchError(error)
    }
}
