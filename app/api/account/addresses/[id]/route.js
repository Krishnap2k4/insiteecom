import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import AddressModel from '@/models/Address.model'
import UserModel from '@/models/User.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

const addressUpdateSchema = z.object({
    label: z.string().trim().max(50).optional(),
    fullName: z.string().trim().max(120).optional(),
    phone: z.string().trim().min(7).optional(),
    line1: z.string().trim().min(3).optional(),
    line2: z.string().trim().optional(),
    landmark: z.string().trim().optional(),
    city: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
    country: z.string().trim().min(2).optional(),
    pincode: z.string().trim().min(3).optional(),
    type: z.enum(['billing', 'shipping', 'both']).optional(),
})

export async function PUT(request, { params }) {
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

        const payload = await request.json()
        const validate = addressUpdateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const address = await AddressModel.findOne({
            _id: id, user: auth.userId, deletedAt: null,
        })
        if (!address) {
            return response(false, 404, 'Address not found.')
        }

        Object.assign(address, validate.data)
        await address.save()

        return response(true, 200, 'Address updated.', address.toObject())
    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request, { params }) {
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

        const wasDefault = address.isDefault
        address.deletedAt = new Date()
        if (wasDefault) {
            address.isDefault = false
        }
        await address.save()

        // If we deleted the default, promote the most-recently-updated
        // remaining address (if any) so the user never ends up without one.
        if (wasDefault) {
            const next = await AddressModel.findOne({
                user: auth.userId, deletedAt: null,
            }).sort({ updatedAt: -1 })

            if (next) {
                next.isDefault = true
                await next.save()
                await UserModel.updateOne(
                    { _id: auth.userId },
                    { $set: { defaultAddress: next._id } }
                )
            } else {
                await UserModel.updateOne(
                    { _id: auth.userId },
                    { $unset: { defaultAddress: '' } }
                )
            }
        }

        return response(true, 200, 'Address removed.')
    } catch (error) {
        return catchError(error)
    }
}
