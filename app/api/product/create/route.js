import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { generateUniquePublicId } from "@/lib/publicId"
import { recordAudit } from "@/lib/audit"
import { zSchema } from "@/lib/zodSchema"
import ProductModel from "@/models/Product.model"
import { encode } from "entities"
import { z } from "zod"

const optionSchema = z.object({
    name: z.string().trim().min(1),
    values: z.array(z.string().trim().min(1)).default([]),
    position: z.coerce.number().int().optional().default(0),
})

const specSchema = z.object({
    name: z.string().trim().min(1),
    value: z.string().trim().min(1),
})

/** Storefront listing-card display copy. All fields optional. */
const cardSchema = z.object({
    badge:         z.string().trim().max(40).optional().default(''),
    subtitle:      z.string().trim().max(160).optional().default(''),
    audienceLabel: z.string().trim().max(60).optional().default(''),
    sizeLabel:     z.string().trim().max(30).optional().default(''),
    highlights:    z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
    bundleOffer:   z.string().trim().max(120).optional().default(''),
})

const extensionSchema = z.object({
    brand: z.string().nullable().optional(),
    sku: z.string().trim().optional(),
    shortDescription: z.string().trim().max(500).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    options: z.array(optionSchema).max(3, 'A product can have at most 3 options.').optional(),
    specifications: z.array(specSchema).optional(),
    card: cardSchema.optional(),
    seo: z.object({
        title: z.string().trim().optional(),
        description: z.string().trim().optional(),
        canonical: z.string().trim().optional(),
        ogImage: z.string().nullable().optional(),
    }).optional(),
})

/**
 * Create a product. Returns its id and publicId. The product is NOT
 * purchasable until the admin explicitly adds at least one variant
 * via the Variants section on the edit page. The storefront shows
 * "Out of stock" until then.
 */
export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()

        const baseSchema = zSchema.pick({
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

        const productData = validate.data

        const publicId = await generateUniquePublicId(async (candidate) =>
            await ProductModel.exists({ publicId: candidate })
        )

        const newProduct = new ProductModel({
            name: productData.name,
            slug: productData.slug,
            publicId,
            sku: productData.sku,
            brand: productData.brand || undefined,
            category: productData.category,
            categories: productData.categories || [],
            mrp: productData.mrp,
            sellingPrice: productData.sellingPrice,
            discountPercentage: productData.discountPercentage,
            description: encode(productData.description),
            shortDescription: productData.shortDescription,
            status: productData.status || 'published',
            tags: productData.tags || [],
            options: (productData.options || []).map((o, i) => ({
                name: o.name,
                values: o.values || [],
                position: o.position ?? i,
            })),
            specifications: productData.specifications || [],
            card: productData.card || {},
            seo: productData.seo,
            media: productData.media,
        })

        await newProduct.save()

        recordAudit({
            actor: auth.userId,
            actorRole: 'admin',
            action: 'product.create',
            entity: 'Product',
            entityId: newProduct._id,
            after: {
                slug: newProduct.slug,
                publicId: newProduct.publicId,
                status: newProduct.status,
            },
        })

        return response(true, 201, 'Product created. Add at least one variant on the edit page to make it purchasable.', {
            productId: newProduct._id,
            publicId: newProduct.publicId,
        })
    } catch (error) {
        return catchError(error)
    }
}
