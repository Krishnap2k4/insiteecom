import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import ProductVariantModel from "@/models/ProductVariant.model"
import { z } from "zod"

const optionValueSchema = z.object({
    name: z.string().trim().min(1),
    value: z.string().trim().min(1),
})

const extensionSchema = z.object({
    optionValues: z.array(optionValueSchema).optional(),
    barcode: z.string().trim().optional(),
    costPrice: z.coerce.number().optional(),
    status: z.enum(['active', 'inactive']).optional(),
})

const COLOR_NAMES = new Set(['color', 'colour'])
const SIZE_NAMES = new Set(['size'])

const valueByName = (optionValues, predicate) => {
    const match = (optionValues || []).find((ov) => predicate(String(ov.name || '').toLowerCase()))
    return match?.value || ''
}

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

        const validatedData = validate.data

        const variant = await ProductVariantModel.findOne({ deletedAt: null, _id: validatedData._id })
        if (!variant) {
            return response(false, 404, 'Data not found.')
        }

        const optionValues = validatedData.optionValues ?? variant.optionValues ?? []
        const derivedColor = validatedData.color !== undefined
            ? validatedData.color
            : valueByName(optionValues, (n) => COLOR_NAMES.has(n)) || variant.color || ''
        const derivedSize = validatedData.size !== undefined
            ? validatedData.size
            : valueByName(optionValues, (n) => SIZE_NAMES.has(n)) || variant.size || ''

        variant.product = validatedData.product
        variant.color = derivedColor
        variant.size = derivedSize
        variant.sku = validatedData.sku
        variant.mrp = validatedData.mrp
        variant.sellingPrice = validatedData.sellingPrice
        variant.discountPercentage = validatedData.discountPercentage
        variant.media = validatedData.media
        if (validatedData.optionValues !== undefined) variant.optionValues = validatedData.optionValues
        if (validatedData.barcode !== undefined) variant.barcode = validatedData.barcode
        if (validatedData.costPrice !== undefined) variant.costPrice = validatedData.costPrice
        if (validatedData.status !== undefined) variant.status = validatedData.status
        await variant.save()

        return response(true, 200, 'Variant updated.')
    } catch (error) {
        return catchError(error)
    }
}
