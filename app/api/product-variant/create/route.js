import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import InventoryModel from "@/models/Inventory.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import { z } from "zod"

const optionValueSchema = z.object({
    name: z.string().trim().min(1),
    value: z.string().trim().min(1),
})

const extensionSchema = z.object({
    optionValues: z.array(optionValueSchema).optional().default([]),
    barcode: z.string().trim().optional(),
    costPrice: z.coerce.number().optional(),
    status: z.enum(['active', 'inactive']).optional(),
})

/**
 * Variant create.
 *
 * `optionValues[]` carries the chosen value for each option defined on
 * the parent product. For single-SKU products (no options), it's an
 * empty array.
 *
 * Legacy `color`/`size` fields are auto-derived from optionValues so
 * the cart format and storefront filter endpoints keep working without
 * per-call adapter code.
 */
const COLOR_NAMES = new Set(['color', 'colour'])
const SIZE_NAMES = new Set(['size'])

const valueByName = (optionValues, predicate) => {
    const match = (optionValues || []).find((ov) => predicate(String(ov.name || '').toLowerCase()))
    return match?.value || ''
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()

        const baseSchema = zSchema.pick({
            product: true,
            sku: true,
            color: true,
            size: true,
            mrp: true,
            sellingPrice: true,
            discountPercentage: true,
            media: true,
        }).extend({
            color: z.string().optional(),
            size: z.string().optional(),
        })
        const schema = baseSchema.merge(extensionSchema)

        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const variantData = validate.data
        const derivedColor = variantData.color || valueByName(variantData.optionValues, (n) => COLOR_NAMES.has(n))
        const derivedSize = variantData.size || valueByName(variantData.optionValues, (n) => SIZE_NAMES.has(n))

        const newProductVariant = new ProductVariantModel({
            product: variantData.product,
            color: derivedColor,
            size: derivedSize,
            sku: variantData.sku,
            mrp: variantData.mrp,
            sellingPrice: variantData.sellingPrice,
            discountPercentage: variantData.discountPercentage,
            media: variantData.media,
            optionValues: variantData.optionValues,
            barcode: variantData.barcode,
            costPrice: variantData.costPrice,
            status: variantData.status || 'active',
        })

        await newProductVariant.save()

        try {
            await InventoryModel.create({
                variant: newProductVariant._id,
                product: variantData.product,
                warehouse: 'default',
                quantity: 0,
                reserved: 0,
            })
        } catch {
            // Non-fatal — migrate-catalog backfills missing inventory rows.
        }

        return response(true, 201, 'Variant added.', { _id: newProductVariant._id })
    } catch (error) {
        return catchError(error)
    }
}
