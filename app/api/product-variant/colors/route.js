import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ProductModel from "@/models/Product.model";

export async function GET() {
    try {
        await connectDB()

        // Pull distinct color values from product option definitions
        // (options whose name is "Color" or "Colour", case-insensitive).
        const results = await ProductModel.aggregate([
            { $match: { deletedAt: null, status: { $in: ['published', null, undefined] } } },
            { $unwind: '$options' },
            { $match: { 'options.name': { $regex: /^colou?r$/i } } },
            { $unwind: '$options.values' },
            { $group: { _id: '$options.values' } },
            { $sort: { _id: 1 } },
        ])

        const colors = results.map((r) => r._id).filter(Boolean)
        return response(true, 200, 'Color found.', colors)

    } catch (error) {
        return catchError(error)
    }
}