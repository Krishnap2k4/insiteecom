import { connectDB } from "@/lib/databaseConnection"
import { parseProductSlug, buildProductSlug } from "@/lib/publicId"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import ReviewModel from "@/models/Review.model"
// Import referenced models as named values so we can pass the actual
// model instance to .populate({ model: ... }), bypassing Mongoose's
// string-based model registry entirely. That registry is the #1 cause
// of dev-only "MissingSchemaError: Schema hasn't been registered" errors
// after a Next.js HMR reload — modules loaded in a different order can
// run a populate before the referenced schema has registered. Passing
// the model instance directly means we depend on nothing but the
// import graph, which is deterministic in both dev and prod.
import MediaModel from "@/models/Media.model"
import BrandModel from "@/models/Brand.model"

const isBlank = (value) => !value || String(value).trim() === ''
const optionKey = (n) => String(n).toLowerCase().replace(/\s+/g, '-')

/**
 * Force-serialize Mongoose lean output to pure JSON-safe primitives.
 * ObjectId → hex string (via its toJSON), Date → ISO string. Server
 * components passing the result into Client Components need this; the
 * previous HTTP flow used to do it implicitly via NextResponse.json.
 */
const toPlain = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))

/**
 * Core product-details data fetch — pure function, no HTTP.
 *
 * Both the public API route handler (`/api/product/details/[slug]`) AND
 * the server component (`/product/[slug]/page.jsx`) call this directly.
 * That eliminates the production-only failure mode of a server-side
 * fetch loopback from the page to its own /api route (host/cookie
 * resolution issues, env var dependence, doubled cold-start latency).
 *
 * Returns `{ ok: true, data }` on success, `{ ok: false, status, message }`
 * on failure — callers wrap whatever shape they need around it.
 */
export const getProductDetails = async (rawSlug, queryParams = {}) => {
    if (!rawSlug) return { ok: false, status: 404, message: 'Product not found.' }

    try {
        await connectDB()

        const { slug, publicId } = parseProductSlug(rawSlug)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[getProductDetails] lookup rawSlug="${rawSlug}" → slug="${slug}" publicId="${publicId || '(none)'}"`)
        }

        let getProduct = null
        let canonicalSlugMismatch = false
        const statusFilter = { $in: ['published', null, undefined] }

        if (publicId) {
            getProduct = await ProductModel
                .findOne({ deletedAt: null, publicId, status: statusFilter })
                .populate({ path: 'media', select: 'secure_url', model: MediaModel })
                .populate({ path: 'brand', select: '_id name slug', model: BrandModel })
                .lean()
            if (getProduct && getProduct.slug !== slug) {
                canonicalSlugMismatch = true
            }
        }

        if (!getProduct) {
            getProduct = await ProductModel
                .findOne({ deletedAt: null, slug: rawSlug, status: statusFilter })
                .populate({ path: 'media', select: 'secure_url', model: MediaModel })
                .populate({ path: 'brand', select: '_id name slug', model: BrandModel })
                .lean()
        }

        if (!getProduct) {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[getProductDetails] no product matched rawSlug="${rawSlug}" — returning 404`)
            }
            return { ok: false, status: 404, message: 'Product not found.' }
        }

        const baseFilter = { product: getProduct._id, deletedAt: null }
        const variants = await ProductVariantModel
            .find({ ...baseFilter, status: { $ne: 'inactive' } })
            .populate({ path: 'media', select: 'secure_url', model: MediaModel })
            .lean()

        // Storefront option list comes from product.options[] (new model).
        // Legacy products without options derive a synthetic list from
        // variant.color/size so they still render selectors.
        let options = []
        if (Array.isArray(getProduct.options) && getProduct.options.length > 0) {
            options = getProduct.options.map((o) => ({
                name: o.name,
                position: o.position,
                values: (o.values || []).map((v) => ({ value: v, label: v })),
            }))
        } else {
            const colorSet = new Set()
            const sizeSet = new Set()
            for (const v of variants) {
                if (!isBlank(v.color)) colorSet.add(v.color)
                if (!isBlank(v.size)) sizeSet.add(v.size)
            }
            if (colorSet.size > 0) {
                options.push({
                    name: 'Color',
                    position: 1,
                    values: [...colorSet].map((v) => ({ value: v, label: v })),
                })
            }
            if (sizeSet.size > 0) {
                options.push({
                    name: 'Size',
                    position: 2,
                    values: [...sizeSet].map((v) => ({ value: v, label: v })),
                })
            }
        }

        // Read the customer's selection from queryParams. Accept both
        // hyphenated and lowercase keys for option lookup.
        const selection = {}
        for (const opt of options) {
            const k1 = optionKey(opt.name)
            const k2 = opt.name.toLowerCase()
            const fromUrl = queryParams[k1] || queryParams[k2]
            if (fromUrl) selection[opt.name] = fromUrl
        }

        const variantValueFor = (variant, optionName) => {
            if (Array.isArray(variant.optionValues) && variant.optionValues.length > 0) {
                const hit = variant.optionValues.find((ov) => ov.name === optionName)
                if (hit) return hit.value
            }
            if (/color/i.test(optionName)) return variant.color || ''
            if (/size/i.test(optionName)) return variant.size || ''
            return ''
        }

        const variantMatchesSelection = (v) => {
            for (const [name, value] of Object.entries(selection)) {
                if (variantValueFor(v, name) !== value) return false
            }
            return true
        }

        const variant = variants.find(variantMatchesSelection) || variants[0] || null

        const selectionValues = {}
        if (variant) {
            for (const opt of options) {
                selectionValues[opt.name] = selection[opt.name] || variantValueFor(variant, opt.name)
            }
        }

        // Legacy storefront fallbacks. New code reads `options`.
        const colorsOpt = options.find((o) => /color/i.test(o.name))
        const sizesOpt  = options.find((o) => /size/i.test(o.name))
        const colors = colorsOpt ? colorsOpt.values.map((v) => v.value) : []
        const sizes  = sizesOpt  ? sizesOpt.values.map((v) => v.value)  : []

        const review = await ReviewModel.countDocuments({ product: getProduct._id })

        const canonicalSlug = getProduct.publicId
            ? buildProductSlug(getProduct.slug, getProduct.publicId)
            : getProduct.slug

        return {
            ok: true,
            data: toPlain({
                product: getProduct,
                variant: variant || null,
                options,
                selectionValues,
                specifications: getProduct.specifications || [],
                axes: options.map((o) => ({
                    code: optionKey(o.name),
                    label: o.name,
                    type: /color/i.test(o.name) ? 'color' : 'select',
                    values: o.values,
                })),
                colors,
                sizes,
                reviewCount: review,
                canonicalSlug,
                canonicalUrl: `/product/${canonicalSlug}`,
                slugMismatch: canonicalSlugMismatch,
            }),
        }
    } catch (error) {
        console.error('[getProductDetails] threw for rawSlug=', rawSlug, '—', error?.message || error)
        if (process.env.NODE_ENV !== 'production') {
            console.error(error?.stack || error)
        }
        return { ok: false, status: 500, message: error?.message || 'Internal server error.' }
    }
}
