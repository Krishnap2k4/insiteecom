'use client'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
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
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const formatINR = (value) =>
    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

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

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { data: res } = await axios.get('/api/account/wishlist/count')
                if (!cancelled && res?.success) {
                    dispatch(setWishlistCount(res.data?.count ?? 0))
                }
            } catch { /* best-effort */ }
        }
        load()
        return () => { cancelled = true }
    }, [auth, lastChange, dispatch])

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
        return () => { cancelled = true }
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
            <SheetTrigger className='relative hover:text-[#E5C76B] transition-colors cursor-pointer'>
                <Heart size={18} />
                {count > 0 && (
                    <span className='absolute bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex justify-center items-center -right-2 -top-1'>
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </SheetTrigger>
            <SheetContent className='sm:max-w-[450px] w-full bg-[#0a0805] border-l border-[#C9A24B]/30 text-white p-0'>
                <SheetHeader className='p-5 border-b border-[#C9A24B]/20'>
                    <SheetTitle className='text-xl font-serif-display text-white flex items-center gap-3'>
                        <Heart size={20} className='text-[#F0D77C]' />
                        My Wishlist
                    </SheetTitle>
                    <SheetDescription className='text-white/50 text-xs'>
                        {isLoggedIn
                            ? 'Items you saved for later.'
                            : 'Sign in to view your saved items.'}
                    </SheetDescription>
                </SheetHeader>

                <div className='h-[calc(100vh-80px)]'>
                    <div className='h-[calc(100%-90px)] overflow-auto px-5 py-4'>
                        {!isLoggedIn && (
                            <div className='h-full flex flex-col justify-center items-center text-center px-6'>
                                <Heart size={48} className='text-[#C9A24B]/30 mb-4' />
                                <p className='text-white/60 mb-4 font-serif-display text-lg'>
                                    Sign in to view items you&apos;ve saved.
                                </p>
                                <Link href={WEBSITE_LOGIN}
                                      onClick={() => setOpen(false)}
                                      className='btn-gold uppercase text-[10px] tracking-[0.25em] font-bold px-8 py-3'>
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {isLoggedIn && loading && (
                            <div className='space-y-3 mt-3'>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className='flex gap-3 border-b border-[#C9A24B]/15 pb-3 animate-pulse'>
                                        <div className='w-20 h-20 bg-[#C9A24B]/10'></div>
                                        <div className='flex-1 space-y-2 py-2'>
                                            <div className='h-3 w-3/4 bg-[#C9A24B]/10'></div>
                                            <div className='h-3 w-1/3 bg-[#C9A24B]/10'></div>
                                            <div className='h-3 w-1/4 bg-[#C9A24B]/10'></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoggedIn && !loading && items.length === 0 && (
                            <div className='h-full flex flex-col justify-center items-center text-center px-6'>
                                <Heart size={48} className='text-[#C9A24B]/30 mb-4' />
                                <p className='text-white/60 font-serif-display text-lg'>
                                    Your wishlist is empty.
                                </p>
                                <p className='text-white/40 text-xs mt-1'>Tap the heart on any product to save it.</p>
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
                                <div key={item._id} className='flex gap-4 mb-4 pb-4 border-b border-[#C9A24B]/15'>
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
                                            className='w-20 h-20 object-cover border border-[#C9A24B]/30'
                                        />
                                    </Link>
                                    <div className='flex-1 min-w-0'>
                                        <Link
                                            href={WEBSITE_PRODUCT_DETAILS(product.slug)}
                                            onClick={() => setOpen(false)}
                                            className='block font-medium text-sm leading-tight line-clamp-2 hover:text-[#F0D77C] transition-colors'
                                        >
                                            {product.name || 'Product'}
                                        </Link>
                                        {variant && (variant.color || variant.size) && (
                                            <p className='text-[10px] text-[#F0D77C]/60 mt-0.5 uppercase tracking-wider'>
                                                {[variant.color, variant.size].filter(Boolean).join(' · ')}
                                            </p>
                                        )}
                                        <p className='flex items-baseline gap-2 mt-1 text-sm'>
                                            <span className='font-serif-display gold-text'>{formatINR(price)}</span>
                                            {hasDiscount && (
                                                <span className='line-through text-white/30 text-xs'>{formatINR(mrp)}</span>
                                            )}
                                        </p>
                                        <div className='flex gap-2 mt-3'>
                                            <button
                                                type='button'
                                                onClick={() => handleAddToCart(item)}
                                                disabled={busyId === item._id}
                                                className='btn-gold uppercase text-[9px] tracking-[0.2em] font-bold px-3 py-1.5 flex items-center gap-1 cursor-pointer disabled:opacity-50'
                                            >
                                                <ShoppingBag size={11} /> Add to cart
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleRemove(item)}
                                                disabled={busyId === item._id}
                                                className='text-white/40 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 px-2'
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className='h-[90px] border-t border-[#C9A24B]/30 px-5 pt-4 bg-gradient-to-t from-[#0d0a04] to-[#0a0805]'>
                        <Link href={USER_WISHLIST}
                              onClick={() => setOpen(false)}
                              className='block w-full text-center btn-dark-gold uppercase text-[10px] tracking-[0.25em] font-semibold py-3'>
                            View Full Wishlist
                        </Link>
                        {isLoggedIn && items.length > 0 && (
                            <p className='text-[10px] text-center text-white/40 mt-2'>
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
