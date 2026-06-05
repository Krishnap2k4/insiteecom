import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { isAuthenticated } from '@/lib/authentication'
import { isValidObjectId } from 'mongoose'
import CouponModel from '@/models/Coupon.model'

/**
 * Admin coupon fetch — populates the related refs so the edit form
 * can seed its multi-select pickers with proper labels even before
 * the live category/product/group list endpoints respond.
 */
export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid object id.')

        const coupon = await CouponModel
            .findOne({ _id: id, deletedAt: null })
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug')
            .populate('excludedProducts', 'name slug')
            .populate('customerGroups', 'name')
            .populate('campaign', 'name slug')
            .lean()
        if (!coupon) return response(false, 404, 'Coupon not found.')

        return response(true, 200, 'Coupon found.', coupon)
    } catch (error) {
        return catchError(error)
    }
}
