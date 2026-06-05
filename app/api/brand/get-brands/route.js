import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import BrandModel from '@/models/Brand.model'

/**
 * Public-safe lightweight list of active brands. Used by the
 * product create/edit form's brand picker and by the storefront
 * header/footer to render brand links.
 */
export async function GET() {
    try {
        await connectDB()
        const brands = await BrandModel
            .find({ isActive: true, deletedAt: null })
            .sort({ name: 1 })
            .select('_id name slug')
            .lean()
        return response(true, 200, 'Brands fetched.', brands)
    } catch (error) {
        return catchError(error)
    }
}
