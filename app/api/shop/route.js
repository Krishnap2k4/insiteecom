import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";

export async function GET(request) {
    try {

        await connectDB()

        const searchParams = request.nextUrl.searchParams

        // get filters from query params
        const minPrice = parseInt(searchParams.get('minPrice')) || 0
        const maxPrice = parseInt(searchParams.get('maxPrice')) || 100000
        const categorySlug = searchParams.get('category')
        const search = searchParams.get('q')

        // Dynamic option filters: { "Color": ["Red", "Blue"], "Volume": ["100ml"] }
        let optionFilters = {}
        try {
            const raw = searchParams.get('options')
            if (raw) optionFilters = JSON.parse(raw)
        } catch {
            optionFilters = {}
        }



        // pagination 
        const limit = parseInt(searchParams.get('limit')) || 9
        const page = parseInt(searchParams.get('page')) || 0
        const skip = page * limit


        // sorting 
        const sortOption = searchParams.get('sort') || 'default_sorting'
        let sortquery = {}
        if (sortOption === 'default_sorting') sortquery = { createdAt: -1 }
        if (sortOption === 'asc') sortquery = { name: 1 }
        if (sortOption === 'desc') sortquery = { name: -1 }
        if (sortOption === 'price_low_high') sortquery = { sellingPrice: 1 }
        if (sortOption === 'price_high_low') sortquery = { sellingPrice: -1 }
        if (sortOption === 'bestseller') sortquery = { salesCount: -1, createdAt: -1 }


        // find category by slug 
        let categoryId = []
        if (categorySlug) {
            const slugs = categorySlug.split(',')
            const categoryData = await CategoryModel.find({ deletedAt: null, slug: { $in: slugs } }).select('_id').lean()
            categoryId = categoryData.map(category => category._id)
        }

        // match stage — product-level filters
        const matchStage = {
            deletedAt: null,
            status: { $in: ['published', null, undefined] },
        }
        if (categoryId.length > 0) matchStage.category = { $in: categoryId }
        if (search) matchStage.name = { $regex: search, $options: 'i' }

        // Dynamic option filter — one $elemMatch condition per selected option group.
        // Each condition checks that the product defines an option with that name
        // containing at least one of the selected values.
        const optionConditions = Object.entries(optionFilters)
            .filter(([, values]) => Array.isArray(values) && values.length > 0)
            .map(([name, values]) => ({
                options: { $elemMatch: { name, values: { $in: values } } },
            }))
        if (optionConditions.length > 0) matchStage['$and'] = optionConditions


        // Pipeline up to the variant-availability filter — shared between
        // the paginated result and the total count via $facet.
        const baseStages = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'variants'
                }
            },
            {
                $addFields: {
                    variants: {
                        $filter: {
                            input: '$variants',
                            as: 'variant',
                            cond: {
                                $and: [
                                    { $eq: [{ $ifNull: ['$$variant.deletedAt', null] }, null] },
                                    { $gte: ['$$variant.sellingPrice', minPrice] },
                                    { $lte: ['$$variant.sellingPrice', maxPrice] },
                                ]
                            }
                        }
                    }
                }
            },
            { $match: { variants: { $ne: [] } } },
        ]

        // Single $facet query: paginated items AND total count.
        const [result] = await ProductModel.aggregate([
            ...baseStages,
            {
                $facet: {
                    items: [
                        { $sort: sortquery },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'medias',
                                localField: 'media',
                                foreignField: '_id',
                                as: 'media'
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                slug: 1,
                                mrp: 1,
                                sellingPrice: 1,
                                discountPercentage: 1,
                                media: { _id: 1, secure_url: 1, alt: 1 },
                                publicId: 1,
                                card: 1,
                                variants: {
                                    _id: 1,
                                    color: 1,
                                    size: 1,
                                    mrp: 1,
                                    sellingPrice: 1,
                                    discountPercentage: 1,
                                },
                            }
                        }
                    ],
                    total: [{ $count: 'count' }],
                }
            }
        ])

        const products   = result?.items || []
        const total      = result?.total?.[0]?.count || 0
        const totalPages = Math.max(1, Math.ceil(total / limit))
        const nextPage   = (page + 1) * limit < total ? page + 1 : null  // back-compat

        return response(true, 200, 'Product data found.', {
            products,
            total,
            totalPages,
            currentPage: page,
            limit,
            nextPage,
        })

    } catch (error) {
        return catchError(error)
    }
}
