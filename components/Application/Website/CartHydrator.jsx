'use client'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCart, mergeGuestCart } from '@/store/reducer/cartReducer'

/**
 * Mounts once at the website root. On first render it pulls the
 * server-persisted cart into the Redux store. When the auth state
 * flips from guest → logged-in, it triggers a merge so anything the
 * customer added before signing in survives.
 */
const CartHydrator = () => {
    const dispatch = useDispatch()
    const auth = useSelector((s) => s.authStore?.auth)
    const prevAuthId = useRef(null)
    const hydrated = useRef(false)

    useEffect(() => {
        if (!hydrated.current) {
            dispatch(fetchCart())
            hydrated.current = true
        }
    }, [dispatch])

    useEffect(() => {
        const currentId = auth?._id || null
        if (currentId && prevAuthId.current !== currentId) {
            // Auth state just flipped to logged in → merge whichever
            // guest cart was outstanding, then refetch.
            dispatch(mergeGuestCart())
        }
        prevAuthId.current = currentId
    }, [auth, dispatch])

    return null
}

export default CartHydrator
