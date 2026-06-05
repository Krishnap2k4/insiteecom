import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { resolveHierarchy } from "@/lib/catalog"
import { recordAudit } from "@/lib/audit"
import CategoryModel from "@/models/Category.model"
import { z } from "zod"

const categoryCreateSchema = z.object({
    name: z.string().trim().min(2),
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.'),
    parent: z.string().nullable().optional(),
    description: z.string().trim().max(2000).optional().default(''),
    image: z.string().nullable().optional(),
    sortOrder: z.coerce.number().int().optional().default(0),
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
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const validate = categoryCreateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const data = validate.data
        const parentId = data.parent || null

        // Uniqueness of (parent, slug) is enforced by an index, but we
        // surface a friendlier 409 here.
        const conflict = await CategoryModel.findOne({
            parent: parentId,
            slug: data.slug,
            deletedAt: null,
        }).lean()
        if (conflict) {
            return response(false, 409, 'A category with this slug already exists under the chosen parent.')
        }

        const hierarchy = await resolveHierarchy({
            slug: data.slug,
            parentId,
        })

        const newCategory = new CategoryModel({
            name: data.name,
            slug: data.slug,
            description: data.description,
            image: data.image || undefined,
            sortOrder: data.sortOrder,
            isActive: data.isActive,
            seo: data.seo,
            parent: parentId,
            ancestors: hierarchy.ancestors,
            path: hierarchy.path,
            depth: hierarchy.depth,
        })

        await newCategory.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'category.create',
            entity: 'Category',
            entityId: newCategory._id,
            after: newCategory.toObject(),
        })

        return response(true, 200, 'Category added successfully.', { _id: newCategory._id, path: newCategory.path })

    } catch (error) {
        return catchError(error)
    }
}
