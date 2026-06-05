import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { isValidObjectId } from 'mongoose'
import CampaignModel from '@/models/Campaign.model'

export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const doc = await CampaignModel.findOne({ _id: id, deletedAt: null })
            .populate('coupons', 'code discountType discountValue status endsAt')
            .lean()
        if (!doc) return response(false, 404, 'Campaign not found.')
        return response(true, 200, 'Campaign found.', doc)
    } catch (error) {
        return catchError(error)
    }
}
