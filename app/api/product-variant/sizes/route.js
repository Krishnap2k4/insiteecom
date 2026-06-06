import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ProductModel from "@/models/Product.model";

export async function GET() {
    try {
        await connectDB()

        // Pull distinct size values from product option definitions
        // (options whose name is "Size", case-insensitive).
        const results = await ProductModel.aggregate([
            { $match: { deletedAt: null, status: { $in: ['published', null, undefined] } } },
            { $unwind: '$options' },
            { $match: { 'options.name': { $regex: /^size$/i } } },
            { $unwind: '$options.values' },
            { $group: { _id: '$options.values' } },
            { $sort: { _id: 1 } },
        ])

        const sizes = results.map((r) => r._id).filter(Boolean)
        return response(true, 200, 'Size found.', sizes)

    } catch (error) {
        return catchError(error)
    }
}