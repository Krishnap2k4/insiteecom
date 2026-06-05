import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { logger } from '@/lib/logger'
import { generateUniquePublicId } from '@/lib/publicId'
import BrandModel from '@/models/Brand.model'
import CategoryModel from '@/models/Category.model'
import InventoryModel from '@/models/Inventory.model'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'

/**
 * Idempotent migrator for Module 2 catalog changes:
 *
 *   1. Backfill `publicId` on every Product that doesn't have one.
 *      Re-runs are harmless — products with an existing id are skipped.
 *
 *   2. Compute `path`, `ancestors`, `depth` on Category documents that
 *      lack them. Treats all existing categories as roots (parent=null)
 *      since the old schema had no parent field. After the migration,
 *      admins can move categories into a tree via the admin UI and the
 *      tree helpers in `lib/catalog.js` propagate the change.
 *
 *   3. Ensure a `generic` Brand exists so admins have a default to pick
 *      and so the storefront can render `/b/generic` while the catalog
 *      is being curated.
 *
 *   4. Create one Inventory row per ProductVariant (default warehouse,
 *      quantity 0). Skips variants that already have a row.
 *
 * Admin-only. Documented in PHASE1_NOTES.md with a curl example.
 */
export async function POST() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()

        // ---- 1. Backfill product publicIds ----
        const productsMissingId = await ProductModel
            .find({ $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }] })
            .select('_id slug')
            .lean()

        let publicIdsAssigned = 0
        const publicIdFailures = []
        for (const p of productsMissingId) {
            try {
                const id = await generateUniquePublicId(async (candidate) =>
                    await ProductModel.exists({ publicId: candidate })
                )
                await ProductModel.updateOne({ _id: p._id }, { $set: { publicId: id } })
                publicIdsAssigned += 1
            } catch (err) {
                publicIdFailures.push({ productId: String(p._id), slug: p.slug, reason: err?.message })
                logger.error('publicId assignment failed', { productId: String(p._id), error: err })
            }
        }

        // ---- 2. Compute category hierarchy ----
        const categoriesMissing = await CategoryModel
            .find({
                deletedAt: null,
                $or: [
                    { path: { $exists: false } },
                    { path: null },
                    { path: '' },
                    { depth: { $exists: false } },
                ],
            })
            .select('_id slug parent')
            .lean()

        const categoryOps = []
        for (const cat of categoriesMissing) {
            const isRoot = !cat.parent
            categoryOps.push({
                updateOne: {
                    filter: { _id: cat._id },
                    update: {
                        $set: {
                            parent: cat.parent || null,
                            ancestors: isRoot ? [] : (cat.ancestors || []),
                            path: isRoot ? cat.slug : (cat.path || cat.slug),
                            depth: isRoot ? 0 : (cat.depth || 0),
                            isActive: cat.isActive ?? true,
                        },
                    },
                },
            })
        }
        const categoryResult = categoryOps.length
            ? await CategoryModel.bulkWrite(categoryOps)
            : { modifiedCount: 0 }

        // ---- 3. Ensure a default 'generic' brand ----
        let genericBrandCreated = false
        let genericBrand = await BrandModel.findOne({ slug: 'generic' })
        if (!genericBrand) {
            genericBrand = await BrandModel.create({
                name: 'Generic',
                slug: 'generic',
                description: 'Default brand for un-branded products.',
                isActive: true,
                isSystem: true,
            })
            genericBrandCreated = true
        }

        // ---- 4. Mirror legacy data into the new options/optionValues
        //          and specifications shape ----
        //
        // For each product: derive Color / Size options from existing
        // variants if the product doesn't already have options. For each
        // variant: derive optionValues from color/size + legacy
        // attributes[] entries. For each product: move legacy
        // attributes[] into specifications[]. All idempotent.

        const products = await ProductModel
            .find({ deletedAt: null })
            .select('_id options specifications attributes')
            .lean()

        let productOptionsSet = 0
        let productSpecsSet = 0
        const productOps = []
        for (const p of products) {
            const set = {}

            const hasOptions = Array.isArray(p.options) && p.options.length > 0
            if (!hasOptions) {
                const variantsForProduct = await ProductVariantModel
                    .find({ product: p._id, deletedAt: null, isDefault: { $ne: true } })
                    .select('color size attributes')
                    .lean()
                const colorSet = new Set()
                const sizeSet = new Set()
                for (const v of variantsForProduct) {
                    if (v.color && String(v.color).trim() !== '') colorSet.add(v.color)
                    if (v.size && String(v.size).trim() !== '') sizeSet.add(v.size)
                }
                const opts = []
                if (colorSet.size > 0) {
                    opts.push({ name: 'Color', values: [...colorSet], position: 1 })
                }
                if (sizeSet.size > 0) {
                    opts.push({ name: 'Size', values: [...sizeSet], position: 2 })
                }
                if (opts.length > 0) {
                    set.options = opts
                    productOptionsSet += 1
                }
            }

            const hasSpecs = Array.isArray(p.specifications) && p.specifications.length > 0
            if (!hasSpecs && Array.isArray(p.attributes) && p.attributes.length > 0) {
                set.specifications = p.attributes
                    .filter((a) => a.value && a.code !== 'color' && a.code !== 'size')
                    .map((a) => ({ name: a.label || a.code, value: a.valueLabel || a.value }))
                if (set.specifications.length > 0) productSpecsSet += 1
                else delete set.specifications
            }

            if (Object.keys(set).length > 0) {
                productOps.push({ updateOne: { filter: { _id: p._id }, update: { $set: set } } })
            }
        }
        if (productOps.length > 0) await ProductModel.bulkWrite(productOps)

        // Now mirror per-variant data into optionValues[].
        const variantsToMirror = await ProductVariantModel
            .find({
                deletedAt: null,
                $or: [
                    { optionValues: { $exists: false } },
                    { optionValues: { $size: 0 } },
                ],
            })
            .select('_id color size attributes')
            .lean()

        const mirrorOps = []
        for (const v of variantsToMirror) {
            const ovs = []
            if (v.color && String(v.color).trim() !== '') {
                ovs.push({ name: 'Color', value: v.color })
            }
            if (v.size && String(v.size).trim() !== '') {
                ovs.push({ name: 'Size', value: v.size })
            }
            if (Array.isArray(v.attributes)) {
                for (const a of v.attributes) {
                    if (!a.value) continue
                    if (a.code === 'color' || a.code === 'size') continue
                    const name = a.label || a.code
                    if (ovs.some((existing) => existing.name === name)) continue
                    ovs.push({ name, value: a.valueLabel || a.value })
                }
            }
            if (ovs.length > 0) {
                mirrorOps.push({
                    updateOne: {
                        filter: { _id: v._id },
                        update: { $set: { optionValues: ovs } },
                    },
                })
            }
        }
        const mirrorResult = mirrorOps.length
            ? await ProductVariantModel.bulkWrite(mirrorOps)
            : { modifiedCount: 0 }

        // ---- 5. Clean up legacy auto-managed `isDefault` variants ----
        // The new model has no implicit "default" variant. For every
        // product:
        //   - if real variants exist alongside the default → soft-delete
        //     the default (real ones survive).
        //   - if ONLY the default exists → keep it (it's the single SKU
        //     the admin clearly intended) but unset the isDefault flag.
        // Finally, remove the isDefault field from every variant document
        // so the DB matches the schema.
        const variantsCollection = ProductVariantModel.collection
        const productsWithDefault = await variantsCollection
            .aggregate([
                { $match: { isDefault: true, deletedAt: null } },
                { $group: { _id: '$product' } },
            ])
            .toArray()

        let defaultsSoftDeleted = 0
        let defaultsPromoted = 0
        for (const row of productsWithDefault) {
            const productId = row._id
            const realCount = await variantsCollection.countDocuments({
                product: productId,
                isDefault: { $ne: true },
                deletedAt: null,
            })
            if (realCount > 0) {
                const result = await variantsCollection.updateMany(
                    { product: productId, isDefault: true, deletedAt: null },
                    { $set: { deletedAt: new Date() } }
                )
                defaultsSoftDeleted += result.modifiedCount || 0
            } else {
                const result = await variantsCollection.updateMany(
                    { product: productId, isDefault: true, deletedAt: null },
                    { $unset: { isDefault: '' } }
                )
                defaultsPromoted += result.modifiedCount || 0
            }
        }
        // Final sweep — drop isDefault from any remaining variant docs.
        const finalSweep = await variantsCollection.updateMany(
            { isDefault: { $exists: true } },
            { $unset: { isDefault: '' } }
        )

        // ---- 6. Seed Inventory rows for variants ----
        const variants = await ProductVariantModel
            .find({ deletedAt: null })
            .select('_id product')
            .lean()

        let inventoryCreated = 0
        for (const v of variants) {
            const existing = await InventoryModel
                .findOne({ variant: v._id, warehouse: 'default', deletedAt: null })
                .lean()
            if (existing) continue
            try {
                await InventoryModel.create({
                    variant: v._id,
                    product: v.product,
                    warehouse: 'default',
                    quantity: 0,
                    reserved: 0,
                })
                inventoryCreated += 1
            } catch (err) {
                logger.warn('inventory seed failed', { variantId: String(v._id), error: err })
            }
        }

        const summary = {
            products: {
                scanned: productsMissingId.length,
                publicIdsAssigned,
                failures: publicIdFailures,
            },
            categories: {
                scanned: categoriesMissing.length,
                updated: categoryResult.modifiedCount || 0,
            },
            brands: {
                genericCreated: genericBrandCreated,
                genericBrandId: genericBrand?._id,
            },
            productOptions: {
                productsScanned: products.length,
                optionsBackfilled: productOptionsSet,
                specsBackfilled: productSpecsSet,
            },
            variantOptionValues: {
                scanned: variantsToMirror.length,
                mirrored: mirrorResult.modifiedCount || 0,
            },
            legacyDefaultVariants: {
                productsScanned: productsWithDefault.length,
                softDeleted: defaultsSoftDeleted,
                promotedToRegular: defaultsPromoted,
                isDefaultFieldDropped: finalSweep.modifiedCount || 0,
            },
            inventory: {
                created: inventoryCreated,
                variantsScanned: variants.length,
            },
        }

        logger.info('migrate-catalog run complete', summary)

        return response(true, 200, 'Catalog migration complete.', summary)
    } catch (error) {
        return catchError(error)
    }
}
