import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { propagateHierarchy, resolveHierarchy } from "@/lib/catalog"
import { recordAudit } from "@/lib/audit"
import CategoryModel from "@/models/Category.model"
import { z } from "zod"

const categoryUpdateSchema = z.object({
    _id: z.string(),
    name: z.string().trim().min(2).optional(),
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/).optional(),
    parent: z.string().nullable().optional(),
    description: z.string().trim().max(2000).optional(),
    image: z.string().nullable().optional(),
    sortOrder: z.coerce.number().int().optional(),
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
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const validate = categoryUpdateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const data = validate.data
        const { _id } = data

        const category = await CategoryModel.findOne({ deletedAt: null, _id })
        if (!category) {
            return response(false, 404, 'Category not found.')
        }

        const before = category.toObject()
        const newSlug = data.slug ?? category.slug
        const newParentId = data.parent === undefined ? category.parent : data.parent

        // Reject moving a category beneath itself or its descendants.
        if (newParentId && String(newParentId) === String(category._id)) {
            return response(false, 400, 'A category cannot be its own parent.')
        }
        if (newParentId) {
            const newParent = await CategoryModel.findOne({ _id: newParentId, deletedAt: null }).select('ancestors').lean()
            if (newParent && (newParent.ancestors || []).map(String).includes(String(category._id))) {
                return response(false, 400, 'Cannot move a category beneath its own descendant.')
            }
        }

        // Slug uniqueness within the new sibling set.
        const slugChanged = newSlug !== category.slug
        const parentChanged = String(newParentId || '') !== String(category.parent || '')
        if (slugChanged || parentChanged) {
            const conflict = await CategoryModel.findOne({
                _id: { $ne: category._id },
                parent: newParentId || null,
                slug: newSlug,
                deletedAt: null,
            }).lean()
            if (conflict) {
                return response(false, 409, 'A category with this slug already exists under the chosen parent.')
            }
        }

        // Apply scalar updates first.
        if (data.name !== undefined) category.name = data.name
        if (data.slug !== undefined) category.slug = data.slug
        if (data.description !== undefined) category.description = data.description
        if (data.image !== undefined) category.image = data.image || undefined
        if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder
        if (data.isActive !== undefined) category.isActive = data.isActive
        if (data.seo !== undefined) category.seo = data.seo

        // Recompute hierarchy if parent or slug moved.
        if (parentChanged || slugChanged) {
            const hierarchy = await resolveHierarchy({
                slug: newSlug,
                parentId: newParentId || null,
            })
            category.parent = newParentId || null
            category.ancestors = hierarchy.ancestors
            category.path = hierarchy.path
            category.depth = hierarchy.depth
        }

        await category.save()

        // Propagate path / depth changes to descendants in bulk.
        if (parentChanged || slugChanged) {
            await propagateHierarchy(category._id)
        }

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'category.update',
            entity: 'Category',
            entityId: category._id,
            before,
            after: category.toObject(),
        })

        return response(true, 200, 'Category updated successfully.')

    } catch (error) {
        return catchError(error)
    }
}
