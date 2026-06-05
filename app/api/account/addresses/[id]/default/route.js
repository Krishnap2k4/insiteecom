import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import AddressModel from '@/models/Address.model'
import UserModel from '@/models/User.model'
import { isValidObjectId } from 'mongoose'

/**
 * POST /api/account/addresses/<id>/default
 *
 * Promote one of the user's addresses to be their default. Clears the
 * default flag on every other address belonging to the same user.
 */
export async function POST(request, { params }) {
    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized.')
        }

        const { id } = await params
        if (!isValidObjectId(id)) {
            return response(false, 400, 'Invalid address id.')
        }

        await connectDB()

        const address = await AddressModel.findOne({
            _id: id, user: auth.userId, deletedAt: null,
        })
        if (!address) {
            return response(false, 404, 'Address not found.')
        }

        await AddressModel.updateMany(
            { user: auth.userId, deletedAt: null, _id: { $ne: address._id } },
            { $set: { isDefault: false } }
        )

        address.isDefault = true
        await address.save()

        await UserModel.updateOne(
            { _id: auth.userId },
            { $set: { defaultAddress: address._id } }
        )

        return response(true, 200, 'Default address updated.')
    } catch (error) {
        return catchError(error)
    }
}
