import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { recordAudit } from "@/lib/audit"
import { zSchema } from "@/lib/zodSchema"
import ProductModel from "@/models/Product.model"
import { encode } from "entities"
import { z } from "zod"

const optionSchema = z.object({
    name: z.string().trim().min(1),
    values: z.array(z.string().trim().min(1)).default([]),
    position: z.coerce.number().int().optional(),
})

const specSchema = z.object({
    name: z.string().trim().min(1),
    value: z.string().trim().min(1),
})

const extensionSchema = z.object({
    brand: z.string().nullable().optional(),
    sku: z.string().trim().optional(),
    shortDescription: z.string().trim().max(500).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    options: z.array(optionSchema).max(3).optional(),
    specifications: z.array(specSchema).optional(),
    seo: z.object({
        title: z.string().trim().optional(),
        description: z.string().trim().optional(),
        canonical: z.string().trim().optional(),
        ogImage: z.string().nullable().optional(),
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

        const baseSchema = zSchema.pick({
            _id: true,
            name: true,
            slug: true,
            category: true,
            mrp: true,
            sellingPrice: true,
            discountPercentage: true,
            description: true,
            media: true,
        })
        const schema = baseSchema.merge(extensionSchema)

        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const validatedData = validate.data

        const getProduct = await ProductModel.findOne({ deletedAt: null, _id: validatedData._id })
        if (!getProduct) {
            return response(false, 404, 'Data not found.')
        }

        const before = {
            slug: getProduct.slug,
            status: getProduct.status,
            brand: getProduct.brand,
        }

        // Scalars from the base schema.
        getProduct.name = validatedData.name
        getProduct.slug = validatedData.slug
        getProduct.category = validatedData.category
        getProduct.mrp = validatedData.mrp
        getProduct.sellingPrice = validatedData.sellingPrice
        getProduct.discountPercentage = validatedData.discountPercentage
        getProduct.description = encode(validatedData.description)
        getProduct.media = validatedData.media

        // Module-2 extension fields (optional — only applied when sent).
        if (validatedData.brand !== undefined) getProduct.brand = validatedData.brand || undefined
        if (validatedData.sku !== undefined) getProduct.sku = validatedData.sku
        if (validatedData.shortDescription !== undefined) getProduct.shortDescription = validatedData.shortDescription
        if (validatedData.status !== undefined) getProduct.status = validatedData.status
        if (validatedData.tags !== undefined) getProduct.tags = validatedData.tags
        if (validatedData.categories !== undefined) getProduct.categories = validatedData.categories
        if (validatedData.options !== undefined) {
            getProduct.options = validatedData.options.map((o, i) => ({
                name: o.name,
                values: o.values || [],
                position: o.position ?? i,
            }))
        }
        if (validatedData.specifications !== undefined) getProduct.specifications = validatedData.specifications
        if (validatedData.seo !== undefined) getProduct.seo = validatedData.seo

        // publicId is immutable — never touch it.

        await getProduct.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'product.update',
            entity: 'Product',
            entityId: getProduct._id,
            before,
            after: {
                slug: getProduct.slug,
                status: getProduct.status,
                brand: getProduct.brand,
            },
        })

        return response(true, 200, 'Product updated successfully.')

    } catch (error) {
        return catchError(error)
    }
}
