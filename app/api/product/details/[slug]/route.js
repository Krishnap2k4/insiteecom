import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { parseProductSlug, buildProductSlug } from "@/lib/publicId";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import ReviewModel from "@/models/Review.model";
// Side-effect imports: register schemas so .populate() doesn't error.
import "@/models/Media.model";
import "@/models/Brand.model";

const isBlank = (value) => !value || String(value).trim() === ''

/**
 * Product detail endpoint.
 *
 * Resolution priority:
 *   1. `/product/<slug>-<publicId>` (new). Lookup by publicId; if the
 *      slug part is stale, return canonicalUrl + slugMismatch so the
 *      page can issue a 301.
 *   2. `/product/<slug>` (legacy). Direct slug lookup.
 *
 * Response shape:
 *   - product:        full product doc
 *   - variant:        the variant matching the customer's selection
 *                     (or any variant / the default fallback)
 *   - options:        product.options[] verbatim — the storefront uses
 *                     this to render selectors (name + values)
 *   - selectionValues: { [optionName]: value } — what the customer
 *                     currently has selected for each option
 *   - colors, sizes:  legacy storefront fallback for products that
 *                     haven't been migrated to options[] yet
 */
export async function GET(request, { params }) {
    try {
        await connectDB()

        const getParams = await params
        const raw = getParams.slug

        const searchParams = request.nextUrl.searchParams

        if (!raw) {
            return response(false, 404, 'Product not found.')
        }

        const { slug, publicId } = parseProductSlug(raw)

        let getProduct = null
        let canonicalSlugMismatch = false

        if (publicId) {
            getProduct = await ProductModel
                .findOne({ deletedAt: null, publicId })
                .populate('media', 'secure_url')
                .populate('brand', '_id name slug')
                .lean()
            if (getProduct && getProduct.slug !== slug) {
                canonicalSlugMismatch = true
            }
        }

        if (!getProduct) {
            getProduct = await ProductModel
                .findOne({ deletedAt: null, slug: raw })
                .populate('media', 'secure_url')
                .populate('brand', '_id name slug')
                .lean()
        }

        if (!getProduct) {
            return response(false, 404, 'Product not found.')
        }

        const baseFilter = { product: getProduct._id, deletedAt: null }
        const populateMedia = (q) => q.populate('media', 'secure_url').lean()

        const variants = await populateMedia(
            ProductVariantModel.find({ ...baseFilter, status: { $ne: 'inactive' } })
        )

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

        // Read the customer's selection from the query string. Each option
        // by name → URL-safe key.
        const optionKey = (n) => String(n).toLowerCase().replace(/\s+/g, '-')
        const selection = {}
        for (const opt of options) {
            const fromUrl = searchParams.get(optionKey(opt.name)) || searchParams.get(opt.name.toLowerCase())
            if (fromUrl) selection[opt.name] = fromUrl
        }

        const variantValueFor = (variant, optionName) => {
            if (Array.isArray(variant.optionValues) && variant.optionValues.length > 0) {
                const hit = variant.optionValues.find((ov) => ov.name === optionName)
                if (hit) return hit.value
            }
            // Legacy fallback for unmigrated variants.
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

        // Pick the variant that matches the customer's selection if any;
        // otherwise pick any variant; otherwise null (= no variants yet,
        // storefront renders "Out of stock").
        const variant = variants.find(variantMatchesSelection) || variants[0] || null

        // Selection rendered for the page — falls back to the current
        // variant's values when the URL doesn't include all options.
        const selectionValues = {}
        if (variant) {
            for (const opt of options) {
                selectionValues[opt.name] = selection[opt.name] || variantValueFor(variant, opt.name)
            }
        }

        // Legacy storefront fallbacks. New code reads `options`.
        const colorsOpt = options.find((o) => /color/i.test(o.name))
        const sizesOpt = options.find((o) => /size/i.test(o.name))
        const colors = colorsOpt ? colorsOpt.values.map((v) => v.value) : []
        const sizes = sizesOpt ? sizesOpt.values.map((v) => v.value) : []

        const review = await ReviewModel.countDocuments({ product: getProduct._id })

        const canonicalSlug = getProduct.publicId
            ? buildProductSlug(getProduct.slug, getProduct.publicId)
            : getProduct.slug

        const productData = {
            product: getProduct,
            variant: variant || null,
            options,
            selectionValues,
            specifications: getProduct.specifications || [],
            // Legacy/compat axes shape (deprecated). Kept so any older
            // client code keeps working until it's updated.
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
        }

        return response(true, 200, 'Product data found.', productData)
    } catch (error) {
        return catchError(error)
    }
}
