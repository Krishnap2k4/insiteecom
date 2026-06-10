import { jwtVerify } from "jose"
import { cookies } from "next/headers"
export const isAuthenticated = async (role) => {
    try {
        const cookieStore = await cookies()
        if (!cookieStore.has('access_token')) {
            return {
                isAuth: false
            }
        }

        const access_token = cookieStore.get('access_token')
        const { payload } = await jwtVerify(access_token.value, new TextEncoder().encode(process.env.SECRET_KEY))

        // Only enforce role when the caller explicitly requests one.
        // isAuthenticated() with no argument means "any logged-in user".
        if (role !== undefined && payload.role !== role) {
            return {
                isAuth: false
            }
        }

        return {
            isAuth: true,
            userId: payload._id
        }

    } catch (error) {
        return {
            isAuth: false,
            error
        }
    }
}
