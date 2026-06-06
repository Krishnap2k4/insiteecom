'use client'
import { Button } from '@/components/ui/button'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { WEBSITE_LOGIN, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { addToCartAsync } from '@/store/reducer/cartReducer'
import { bumpWishlistChange } from '@/store/reducer/wishlistReducer'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiHeart, FiTrash2 } from 'react-icons/fi'
import { BsCart2 } from 'react-icons/bs'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const breadCrumbData = {
    title: 'My Wishlist',
    links: [{ label: 'Wishlist' }],
}

const formatINR = (value) =>
    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

const WishlistPage = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const auth = useSelector((s) => s.authStore.auth)
    const isLoggedIn = Boolean(auth)

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState(null)

    const loadItems = async () => {
        try {
            const { data: res } = await axios.get('/api/account/wishlist')
            if (res?.success) setItems(res.data || [])
        } catch {
            showToast('error', 'Could not load wishlist.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isLoggedIn) loadItems()
        else setLoading(false)
    }, [isLoggedIn])

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
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className='border border-[#C9A24B]/20 bg-[#0a0805]'>
                    <div className='p-5 flex items-center justify-between border-b border-[#C9A24B]/20 gap-3'>
                        <h2 className='text-xl font-serif-display text-[#F0D77C]'>Saved Items</h2>
                        {isLoggedIn && items.length > 0 && (
                            <span className='text-sm text-white/50'>
                                {items.length} item{items.length === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>

                    <div className='p-5'>
                        {!isLoggedIn && (
                            <div className='py-10 text-center'>
                                <FiHeart className='mx-auto text-[#C9A24B]/30 mb-3' size={48} />
                                <p className='text-white/50 mb-4'>Sign in to view items you&apos;ve saved.</p>
                                <Link href={WEBSITE_LOGIN} className='btn-dark-gold px-6 py-2.5 uppercase tracking-widest text-xs font-semibold'>Sign in</Link>
                            </div>
                        )}

                        {isLoggedIn && loading && (
                            <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className='border border-[#C9A24B]/20 overflow-hidden animate-pulse'>
                                        <div className='aspect-square bg-white/5'></div>
                                        <div className='p-3'>
                                            <div className='h-3 w-3/4 bg-white/5 rounded mb-2'></div>
                                            <div className='h-3 w-1/2 bg-white/5 rounded'></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoggedIn && !loading && items.length === 0 && (
                            <div className='py-10 text-center'>
                                <FiHeart className='mx-auto text-[#C9A24B]/30 mb-3' size={48} />
                                <p className='text-white/50 mb-4'>
                                    Your wishlist is empty. Tap the heart icon on any product to save it for later.
                                </p>
                                <Link href={WEBSITE_SHOP} className='btn-dark-gold px-6 py-2.5 uppercase tracking-widest text-xs font-semibold'>Browse shop</Link>
                            </div>
                        )}

                        {isLoggedIn && !loading && items.length > 0 && (
                            <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                                {items.map((item) => {
                                    const product = item.product || {}
                                    const variant = item.variant
                                    const media = variant?.media?.[0]?.secure_url
                                        || product?.media?.[0]?.secure_url
                                        || imgPlaceholder.src
                                    const sellingPrice = variant?.sellingPrice ?? product?.sellingPrice ?? 0
                                    const mrp = variant?.mrp ?? product?.mrp ?? 0
                                    const hasDiscount = mrp > sellingPrice
                                    return (
                                        <div key={item._id} className='border border-[#C9A24B]/20 overflow-hidden flex flex-col hover:border-[#C9A24B]/40 transition'>
                                            <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} className='block aspect-square bg-[#15110a] relative'>
                                                <Image
                                                    src={media}
                                                    width={400}
                                                    height={400}
                                                    alt={product.name || 'Product'}
                                                    className='w-full h-full object-cover object-top'
                                                />
                                            </Link>
                                            <div className='p-3 flex flex-col flex-1'>
                                                <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} className='font-medium line-clamp-2 mb-1 text-white hover:text-[#F0D77C] transition-colors'>
                                                    {product.name || 'Product'}
                                                </Link>
                                                {variant && (variant.color || variant.size) && (
                                                    <p className='text-xs text-white/40 mb-2'>
                                                        {[variant.color, variant.size].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                                <p className='flex gap-2 items-baseline text-sm mb-3'>
                                                    <span className='font-semibold text-[#F0D77C]'>{formatINR(sellingPrice)}</span>
                                                    {hasDiscount && (
                                                        <span className='line-through text-white/30 text-xs'>{formatINR(mrp)}</span>
                                                    )}
                                                </p>
                                                <div className='mt-auto flex flex-col gap-1.5'>
                                                    <Button
                                                        type='button'
                                                        size='sm'
                                                        onClick={() => handleAddToCart(item)}
                                                        className='w-full cursor-pointer btn-dark-gold py-2 uppercase tracking-widest text-xs font-semibold'
                                                    >
                                                        <BsCart2 size={14} className='mr-1' /> Add to cart
                                                    </Button>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='sm'
                                                        onClick={() => handleRemove(item)}
                                                        disabled={busyId === item._id}
                                                        className='w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
                                                    >
                                                        <FiTrash2 size={14} className='mr-1' /> Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default WishlistPage
