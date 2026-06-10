import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ProductModel from "@/models/Product.model";

/**
 * Returns all distinct option groups (name + values) from published products.
 * Used by the storefront filter sidebar to render dynamic option sections.
 *
 * Response shape: [{ name: "Color", values: ["Red", "Blue"] }, { name: "Volume", values: ["50ml", "100ml"] }]
 */
export async function GET() {
    try {
        await connectDB()

        const results = await ProductModel.aggregate([
            { $match: { deletedAt: null, status: { $in: ['published', null, undefined] } } },
            { $unwind: '$options' },
            { $match: { 'options.name': { $nin: [null, ''] } } },
            { $unwind: '$options.values' },
            { $match: { 'options.values': { $nin: [null, ''] } } },
            {
                $group: {
                    _id: '$options.name',
                    values: { $addToSet: '$options.values' },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    values: { $sortArray: { input: '$values', sortBy: 1 } },
                },
            },
        ])

        return response(true, 200, 'Product options fetched.', results)
    } catch (error) {
        return catchError(error)
    }
}
