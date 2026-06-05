import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError } from '@/lib/helperFunction'
import { NextResponse } from 'next/server'
import InventoryModel from '@/models/Inventory.model'
// Register populated schemas.
import '@/models/Product.model'
import '@/models/ProductVariant.model'

/**
 * Aggregate inventory list — one row per (variant, warehouse). Joins
 * product + variant so the admin table can show name + SKU + axes
 * without per-row populates.
 *
 * `available` is computed in the pipeline (quantity - reserved) since
 * the schema's virtual doesn't survive .lean().
 */
export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return NextResponse.json({ success: false, statusCode: 403, message: 'Unauthorized.' }, { status: 403 })
        }
        await connectDB()

        const searchParams = request.nextUrl.searchParams
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 10, 10)
        const filters = JSON.parse(searchParams.get('filters') || '[]')
        const globalFilter = searchParams.get('globalFilter') || ''
        const sorting = JSON.parse(searchParams.get('sorting') || '[]')
        const deleteType = searchParams.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') matchQuery = { deletedAt: null }
        else if (deleteType === 'PD') matchQuery = { deletedAt: { $ne: null } }

        if (globalFilter) {
            matchQuery['$or'] = [
                { 'variantData.sku': { $regex: globalFilter, $options: 'i' } },
                { 'productData.name': { $regex: globalFilter, $options: 'i' } },
                { warehouse: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        for (const filter of filters) {
            matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
        }

        let sortQuery = {}
        for (const sort of sorting) sortQuery[sort.id] = sort.desc ? -1 : 1

        const pipeline = [
            {
                $lookup: {
                    from: 'productvariants',
                    localField: 'variant',
                    foreignField: '_id',
                    as: 'variantData',
                },
            },
            { $unwind: { path: '$variantData', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productData',
                },
            },
            { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
            { $match: matchQuery },
            {
                $addFields: {
                    available: { $max: [{ $subtract: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$reserved', 0] }] }, 0] },
                    lowStock: {
                        $cond: [
                            { $lte: [
                                { $subtract: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$reserved', 0] }] },
                                { $ifNull: ['$reorderLevel', 0] },
                            ] },
                            true,
                            false,
                        ],
                    },
                },
            },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { lowStock: -1, updatedAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    _id: 1,
                    warehouse: 1,
                    quantity: 1,
                    reserved: 1,
                    available: 1,
                    reorderLevel: 1,
                    backorderable: 1,
                    lowStock: 1,
                    product: '$productData.name',
                    productId: '$productData._id',
                    sku: '$variantData.sku',
                    color: '$variantData.color',
                    sizeAxis: '$variantData.size',
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1,
                },
            },
        ]

        const items = await InventoryModel.aggregate(pipeline)
        const totalRowCount = await InventoryModel.countDocuments(matchQuery)

        return NextResponse.json({ success: true, data: items, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}
