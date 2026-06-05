import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const searchParams = request.nextUrl.searchParams

        // Extract query parameters 
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 10, 10)
        const filters = JSON.parse(searchParams.get('filters') || "[]")
        const globalFilter = searchParams.get('globalFilter') || ""
        const sorting = JSON.parse(searchParams.get('sorting') || "[]")
        const deleteType = searchParams.get('deleteType')

        // Build match query  
        let matchQuery = {}

        if (deleteType === 'SD') {
            matchQuery = { deletedAt: null }
        } else if (deleteType === 'PD') {
            matchQuery = { deletedAt: { $ne: null } }
        }

        // Global search 
        if (globalFilter) {
            matchQuery["$or"] = [
                { name: { $regex: globalFilter, $options: 'i' } },
                { slug: { $regex: globalFilter, $options: 'i' } },
                { "categoryData.name": { $regex: globalFilter, $options: 'i' } },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$mrp" },
                            regex: globalFilter,
                            options: 'i'
                        }
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$sellingPrice" },
                            regex: globalFilter,
                            options: 'i'
                        }
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$discountPercentage" },
                            regex: globalFilter,
                            options: 'i'
                        }
                    }
                },
            ]
        }

        //  Column filteration  

        filters.forEach(filter => {
            if (filter.id === 'mrp' || filter.id === 'sellingPrice' || filter.id === 'discountPercentage') {
                matchQuery[filter.id] = Number(filter.value)
            } else {
                matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
            }
        });

        //   Sorting  
        let sortQuery = {}
        sorting.forEach(sort => {
            sortQuery[sort.id] = sort.desc ? -1 : 1
        });


        // Aggregate pipeline
        //
        // `variantStats` counts the variants per product (active ones —
        // soft-deleted excluded) so the admin table can surface a Variants
        // column. We compute total count and custom (non-default) count
        // separately — the default variant is auto-managed by the system,
        // so admins really care about how many CUSTOM variants they've
        // configured.

        const aggregatePipeline = [
            {
                $lookup: {
                    from: 'medias',
                    let: { mediaIds: { $ifNull: ['$media', []] } },
                    pipeline: [
                        { $match: { $expr: { $in: ['$_id', '$$mediaIds'] } } },
                        { $project: { secure_url: 1 } },
                        { $limit: 1 },
                    ],
                    as: 'mediaPreview',
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            {
                $unwind: {
                    path: "$categoryData", preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'productvariants',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$product', '$$productId'] },
                                deletedAt: null,
                            },
                        },
                        { $count: 'total' },
                    ],
                    as: 'variantStats',
                },
            },
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    mrp: 1,
                    sellingPrice: 1,
                    discountPercentage: 1,
                    status: 1,
                    thumbnail: {
                        $ifNull: [{ $arrayElemAt: ['$mediaPreview.secure_url', 0] }, null],
                    },
                    category: "$categoryData.name",
                    variantCount: {
                        $ifNull: [{ $arrayElemAt: ['$variantStats.total', 0] }, 0],
                    },
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1
                }
            }
        ]

        // Execute query  

        const getProduct = await ProductModel.aggregate(aggregatePipeline)

        // Get totalRowCount  
        const totalRowCount = await ProductModel.countDocuments(matchQuery)

        return NextResponse.json({
            success: true,
            data: getProduct,
            meta: { totalRowCount }
        })

    } catch (error) {
        return catchError(error)
    }
}