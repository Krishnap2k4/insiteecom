import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { RATE_LIMITS, rateLimit } from '@/lib/rateLimit'
import AddressModel from '@/models/Address.model'
import UserModel from '@/models/User.model'
import { z } from 'zod'

const addressInputSchema = z.object({
    label: z.string().trim().max(50).optional().default('Home'),
    fullName: z.string().trim().max(120).optional().default(''),
    phone: z.string().trim().min(7, 'Phone is required.'),
    line1: z.string().trim().min(3, 'Address line 1 is required.'),
    line2: z.string().trim().optional().default(''),
    landmark: z.string().trim().optional().default(''),
    city: z.string().trim().min(2, 'City is required.'),
    state: z.string().trim().min(2, 'State is required.'),
    country: z.string().trim().min(2, 'Country is required.'),
    pincode: z.string().trim().min(3, 'Pincode is required.'),
    type: z.enum(['billing', 'shipping', 'both']).optional().default('both'),
    isDefault: z.boolean().optional().default(false),
})

export async function GET() {
    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized.')
        }
        await connectDB()

        const addresses = await AddressModel
            .find({ user: auth.userId, deletedAt: null })
            .sort({ isDefault: -1, updatedAt: -1 })
            .lean()

        return response(true, 200, 'Addresses fetched.', addresses)
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    const limited = rateLimit(request, { name: 'account.addresses.create', ...RATE_LIMITS.AUTH_BURST })
    if (limited) return limited

    try {
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized.')
        }
        await connectDB()

        const payload = await request.json()
        const validate = addressInputSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: validate.error.issues })
        }

        const data = validate.data

        // If this is the first address for the user, force it to be default
        // so checkout always has something to pre-select.
        const existingCount = await AddressModel.countDocuments({
            user: auth.userId,
            deletedAt: null,
        })
        const shouldBeDefault = data.isDefault || existingCount === 0

        if (shouldBeDefault) {
            await AddressModel.updateMany(
                { user: auth.userId, deletedAt: null, isDefault: true },
                { $set: { isDefault: false } }
            )
        }

        const created = await AddressModel.create({
            user: auth.userId,
            ...data,
            isDefault: shouldBeDefault,
        })

        if (shouldBeDefault) {
            await UserModel.updateOne(
                { _id: auth.userId },
                { $set: { defaultAddress: created._id } }
            )
        }

        return response(true, 201, 'Address added.', created.toObject())
    } catch (error) {
        return catchError(error)
    }
}
