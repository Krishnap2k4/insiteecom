import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'

/**
 * Redirect to login if the user is not authenticated.
 * Waits for redux-persist rehydration so logged-in users never see a flash redirect.
 *
 * Returns { auth, isLoggedIn, rehydrated } so the page can conditionally
 * render its content only after auth is confirmed.
 */
const useRequireAuth = () => {
    const auth = useSelector((s) => s.authStore?.auth)
    const rehydrated = useSelector((s) => s._persist?.rehydrated)
    const router = useRouter()

    useEffect(() => {
        if (rehydrated && !auth) {
            router.replace(WEBSITE_LOGIN)
        }
    }, [auth, rehydrated, router])

    return { auth, isLoggedIn: Boolean(auth), rehydrated }
}

export default useRequireAuth
