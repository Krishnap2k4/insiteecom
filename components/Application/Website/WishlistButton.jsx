'use client'
import { Button } from '@/components/ui/button'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { bumpWishlistChange } from '@/store/reducer/wishlistReducer'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiHeart } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'

/**
 * Add-to-wishlist button shown next to Add to Cart on the product
 * page. On mount it asks the wishlist API whether this product/variant
 * is already saved, so the heart icon reflects the current state.
 *
 * Adding/removing dispatches `bumpWishlistChange` so the header badge
 * refetches its count.
 */
const WishlistButton = ({ productId, variantId, className = '' }) => {
    const dispatch = useDispatch()
    const router = useRouter()
    const auth = useSelector((s) => s.authStore.auth)
    const lastChange = useSelector((s) => s.wishlistStore?.lastChange ?? 0)

    const [busy, setBusy] = useState(false)
    const [savedItemId, setSavedItemId] = useState(null)

    useEffect(() => {
        let cancelled = false
        const check = async () => {
            if (!auth) {
                setSavedItemId(null)
                return
            }
            try {
                const { data: res } = await axios.get('/api/account/wishlist')
                if (cancelled || !res?.success) return
                const match = (res.data || []).find((item) => {
                    const itemProductId = item.product?._id || item.product
                    const itemVariantId = item.variant?._id || item.variant
                    if (String(itemProductId) !== String(productId)) return false
                    if (variantId) return String(itemVariantId) === String(variantId)
                    return !itemVariantId
                })
                setSavedItemId(match?._id || null)
            } catch {
                // best-effort — leave state alone
            }
        }
        check()
        return () => { cancelled = true }
    }, [auth, productId, variantId, lastChange])

    const handleToggle = async () => {
        if (!auth) {
            showToast('error', 'Please sign in to use your wishlist.')
            router.push(WEBSITE_LOGIN)
            return
        }

        setBusy(true)
        try {
            if (savedItemId) {
                const { data: res } = await axios.delete(`/api/account/wishlist/${savedItemId}`)
                if (!res?.success) throw new Error(res?.message || 'Could not update wishlist.')
                setSavedItemId(null)
                showToast('success', res.message)
            } else {
                const { data: res } = await axios.post('/api/account/wishlist', {
                    productId,
                    variantId: variantId || null,
                })
                if (!res?.success) throw new Error(res?.message || 'Could not update wishlist.')
                setSavedItemId(res.data?._id || 'unknown')
                showToast('success', res.message)
            }
            dispatch(bumpWishlistChange())
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleToggle}
            disabled={busy}
            className={`rounded-full py-6 text-md cursor-pointer ${savedItemId ? 'border-red-500 text-red-500 hover:bg-red-50' : ''} ${className}`}
            aria-label={savedItemId ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            <FiHeart size={18} className={savedItemId ? 'fill-red-500' : ''} />
            <span>{savedItemId ? 'In Wishlist' : 'Add to Wishlist'}</span>
        </Button>
    )
}

export default WishlistButton
