'use client'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { USER_WISHLIST, WEBSITE_LOGIN, WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { addToCartAsync } from '@/store/reducer/cartReducer'
import {
    bumpWishlistChange,
    setWishlistCount,
} from '@/store/reducer/wishlistReducer'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiHeart, FiTrash2 } from 'react-icons/fi'
import { BsCart2 } from 'react-icons/bs'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const formatINR = (value) =>
    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

/**
 * Header heart icon → slide-out wishlist sheet (mirrors the Cart UX).
 *
 * Lifecycle:
 *   - Count is fetched on mount + whenever `wishlistStore.lastChange`
 *     ticks. Items are loaded only when the sheet opens, so a closed
 *     drawer never touches the network.
 *   - Removing an item updates local state optimistically and bumps
 *     the redux timestamp so the count badge refetches.
 *   - "Add to cart" dispatches the same `addToCartAsync` thunk that the
 *     product page uses, so the Cart drawer reflects the change
 *     immediately. If the wishlist item has no variant attached
 *     (saved before picking color/size) we send the user to the
 *     product page instead.
 */
const WishlistIcon = () => {
    const dispatch = useDispatch()
    const router = useRouter()

    const auth = useSelector((s) => s.authStore.auth)
    const isLoggedIn = Boolean(auth)
    const count = useSelector((s) => s.wishlistStore?.count ?? 0)
    const lastChange = useSelector((s) => s.wishlistStore?.lastChange ?? 0)

    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState(null)

    // Lightweight count fetch on mount and on auth/mutation change.
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { data: res } = await axios.get('/api/account/wishlist/count')
                if (!cancelled && res?.success) {
                    dispatch(setWishlistCount(res.data?.count ?? 0))
                }
            } catch {
                // best-effort
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [auth, lastChange, dispatch])

    // Heavy item fetch only when the drawer is opened (and refetches on changes).
    useEffect(() => {
        if (!open || !isLoggedIn) return
        let cancelled = false
        const loadItems = async () => {
            setLoading(true)
            try {
                const { data: res } = await axios.get('/api/account/wishlist')
                if (!cancelled && res?.success) {
                    setItems(res.data || [])
                }
            } catch {
                if (!cancelled) showToast('error', 'Could not load wishlist.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadItems()
        return () => {
            cancelled = true
        }
    }, [open, isLoggedIn, lastChange])

    const handleRemove = async (item) => {
        setBusyId(item._id)
        try {
            const { data: res } = await axios.delete(`/api/account/wishlist/${item._id}`)
            if (!res?.success) throw new Error(res?.message || 'Could not remove.')
            setItems((prev) => prev.filter((i) => i._id !== item._id))
            dispatch(bumpWishlistChange())
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusyId(null)
        }
    }

    const handleAddToCart = async (item) => {
        const product = item.product || {}
        const variant = item.variant

        // Without a variant we can't safely build the cart line (size /
        // color / SKU / price all live on the variant). Bounce the user
        // to the product page so they can pick.
        if (!variant) {
            setOpen(false)
            router.push(WEBSITE_PRODUCT_DETAILS(product.slug))
            showToast('info', 'Choose options to add this product to your cart.')
            return
        }

        const action = await dispatch(addToCartAsync({
            productId: product._id,
            variantId: variant._id,
            qty: 1,
        }))
        if (action.error) {
            showToast('error', action.error.message || 'Could not add to cart.')
            return
        }
        showToast('success', 'Added to cart.')
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className='relative'>
                <FiHeart size={23} className='text-gray-500 hover:text-primary cursor-pointer' />
                {count > 0 && (
                    <span className='absolute bg-red-500 text-white text-xs rounded-full min-w-4 h-4 px-1 flex justify-center items-center -right-2 -top-1'>
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </SheetTrigger>
            <SheetContent className='sm:max-w-[450px] w-full'>
                <SheetHeader className='py-2'>
                    <SheetTitle className='text-2xl flex items-center gap-2'>
                        <FiHeart /> My Wishlist
                    </SheetTitle>
                    <SheetDescription>
                        {isLoggedIn
                            ? 'Items you saved for later.'
                            : 'Sign in to view your saved items.'}
                    </SheetDescription>
                </SheetHeader>

                <div className='h-[calc(100vh-40px)] pb-10'>
                    <div className='h-[calc(100%-90px)] overflow-auto px-2'>
                        {!isLoggedIn && (
                            <div className='h-full flex flex-col justify-center items-center text-center px-6'>
                                <FiHeart className='text-gray-300 mb-3' size={48} />
                                <p className='text-gray-600 mb-4'>
                                    Sign in to view items you&apos;ve saved.
                                </p>
                                <Button asChild className='cursor-pointer' onClick={() => setOpen(false)}>
                                    <Link href={WEBSITE_LOGIN}>Sign in</Link>
                                </Button>
                            </div>
                        )}

                        {isLoggedIn && loading && (
                            <div className='space-y-3 mt-3'>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className='flex gap-3 border-b pb-3 animate-pulse'>
                                        <div className='w-20 h-20 bg-gray-100 rounded'></div>
                                        <div className='flex-1 space-y-2 py-2'>
                                            <div className='h-3 w-3/4 bg-gray-100 rounded'></div>
                                            <div className='h-3 w-1/3 bg-gray-100 rounded'></div>
                                            <div className='h-3 w-1/4 bg-gray-100 rounded'></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoggedIn && !loading && items.length === 0 && (
                            <div className='h-full flex flex-col justify-center items-center text-center px-6'>
                                <FiHeart className='text-gray-300 mb-3' size={48} />
                                <p className='text-gray-600'>
                                    Your wishlist is empty. Tap the heart on any product to save it for later.
                                </p>
                            </div>
                        )}

                        {isLoggedIn && !loading && items.length > 0 && items.map((item) => {
                            const product = item.product || {}
                            const variant = item.variant
                            const media = variant?.media?.[0]?.secure_url
                                || product?.media?.[0]?.secure_url
                                || imgPlaceholder.src
                            const price = variant?.sellingPrice ?? product?.sellingPrice ?? 0
                            const mrp = variant?.mrp ?? product?.mrp ?? 0
                            const hasDiscount = mrp > price

                            return (
                                <div key={item._id} className='flex gap-3 mb-4 border-b pb-4'>
                                    <Link
                                        href={WEBSITE_PRODUCT_DETAILS(product.slug)}
                                        onClick={() => setOpen(false)}
                                        className='shrink-0'
                                    >
                                        <Image
                                            src={media}
                                            width={80}
                                            height={80}
                                            alt={product.name || 'Product'}
                                            className='w-20 h-20 rounded border object-cover'
                                        />
                                    </Link>
                                    <div className='flex-1 min-w-0'>
                                        <Link
                                            href={WEBSITE_PRODUCT_DETAILS(product.slug)}
                                            onClick={() => setOpen(false)}
                                            className='block font-medium leading-tight line-clamp-2 hover:text-primary'
                                        >
                                            {product.name || 'Product'}
                                        </Link>
                                        {variant && (variant.color || variant.size) && (
                                            <p className='text-xs text-gray-500 mt-0.5'>
                                                {[variant.color, variant.size].filter(Boolean).join(' · ')}
                                            </p>
                                        )}
                                        <p className='flex items-baseline gap-2 mt-1 text-sm'>
                                            <span className='font-semibold'>{formatINR(price)}</span>
                                            {hasDiscount && (
                                                <span className='line-through text-gray-400 text-xs'>{formatINR(mrp)}</span>
                                            )}
                                        </p>
                                        <div className='flex gap-2 mt-2 flex-wrap'>
                                            <Button
                                                type='button'
                                                size='sm'
                                                onClick={() => handleAddToCart(item)}
                                                disabled={busyId === item._id}
                                                className='cursor-pointer h-8'
                                            >
                                                <BsCart2 size={13} className='mr-1' /> Add to cart
                                            </Button>
                                            <Button
                                                type='button'
                                                size='sm'
                                                variant='ghost'
                                                onClick={() => handleRemove(item)}
                                                disabled={busyId === item._id}
                                                className='cursor-pointer h-8 text-red-600 hover:text-red-700 hover:bg-red-50'
                                            >
                                                <FiTrash2 size={13} className='mr-1' /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className='h-[90px] border-t pt-4 px-2 flex flex-col gap-2'>
                        <Button asChild className='w-full' onClick={() => setOpen(false)}>
                            <Link href={USER_WISHLIST}>View full wishlist</Link>
                        </Button>
                        {isLoggedIn && items.length > 0 && (
                            <p className='text-xs text-center text-gray-500'>
                                {items.length} item{items.length === 1 ? '' : 's'} saved
                            </p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default WishlistIcon
