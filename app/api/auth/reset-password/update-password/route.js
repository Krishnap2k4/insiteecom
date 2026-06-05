import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";

export async function PUT(request) {
    const limited = rateLimit(request, { name: 'auth.reset.update', ...RATE_LIMITS.AUTH })
    if (limited) return limited

    try {
        await connectDB()
        const payload = await request.json()
        const validationSchema = zSchema.pick({
            email: true, password: true
        })

        const validatedData = validationSchema.safeParse(payload)
        if (!validatedData.success) {
            return response(false, 401, 'Invalid or missing input field.', validatedData.error)
        }

        const { email, password } = validatedData.data

        const getUser = await UserModel.findOne({ deletedAt: null, email }).select("+password")

        if (!getUser) {
            return response(false, 404, 'User not found.')
        }

        getUser.password = password
        await getUser.save()

        return response(true, 200, 'Password update success.')
    } catch (error) {
        return catchError(error)
    }
}