import { emailVerificationLink } from "@/email/emailVerificationLink";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { logger } from "@/lib/logger";
import { RATE_LIMITS, rateLimit } from "@/lib/rateLimit";
import { sendMail } from "@/lib/sendMail";
import { getSiteSettings } from "@/lib/settings";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";
import { SignJWT } from "jose";

export async function POST(request) {
    const limited = rateLimit(request, { name: 'auth.register', ...RATE_LIMITS.AUTH })
    if (limited) return limited

    try {
        await connectDB()
        // validation schema
        const validationSchema = zSchema.pick({
            name: true, email: true, password: true
        })

        const payload = await request.json()

        const validatedData = validationSchema.safeParse(payload)

        if (!validatedData.success) {
            return response(false, 401, 'Invalid or missing input field.', validatedData.error)
        }

        const { name, email, password } = validatedData.data

        // check already registered user
        const checkUser = await UserModel.exists({ email })
        if (checkUser) {
            return response(false, 409, 'User already registered.')
        }

        // new registration

        const NewRegistration = new UserModel({
            name, email, password
        })

        await NewRegistration.save()

        const secret = new TextEncoder().encode(process.env.SECRET_KEY)
        const token = await new SignJWT({ userId: NewRegistration._id.toString() })
            .setIssuedAt()
            .setExpirationTime('1h')
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)


        const { branding } = await getSiteSettings()
        const mailResult = await sendMail(
            `Email Verification – ${branding?.siteName || 'Verify your email'}`,
            email,
            emailVerificationLink(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email/${token}`)
        )

        if (!mailResult?.success) {
            logger.error('verification email send failed', {
                email,
                userId: NewRegistration._id.toString(),
                reason: mailResult?.message,
            })
            return response(
                false,
                500,
                'Account created, but we could not send the verification email. Please contact support or use the resend link.'
            )
        }

        return response(true, 200, 'Registration success, Please verify your email address.')

    } catch (error) {
        return catchError(error)
    }
}
