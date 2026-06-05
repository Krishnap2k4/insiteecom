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
                <div className='shadow rounded'>
                    <div className='p-5 flex items-center justify-between border-b gap-3'>
                        <h2 className='text-xl font-semibold'>Saved Items</h2>
                        {isLoggedIn && items.length > 0 && (
                            <span className='text-sm text-gray-500'>
                                {items.length} item{items.length === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>

                    <div className='p-5'>
                        {!isLoggedIn && (
                            <div className='py-10 text-center'>
                                <FiHeart className='mx-auto text-gray-300 mb-3' size={48} />
                                <p className='text-gray-600 mb-4'>Sign in to view items you&apos;ve saved.</p>
                                <Button asChild className='cursor-pointer'>
                                    <Link href={WEBSITE_LOGIN}>Sign in</Link>
                                </Button>
                            </div>
                        )}

                        {isLoggedIn && loading && (
                            <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className='border rounded-lg overflow-hidden animate-pulse'>
                                        <div className='aspect-square bg-gray-100'></div>
                                        <div className='p-3'>
                                            <div className='h-3 w-3/4 bg-gray-100 rounded mb-2'></div>
                                            <div className='h-3 w-1/2 bg-gray-100 rounded'></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoggedIn && !loading && items.length === 0 && (
                            <div className='py-10 text-center'>
                                <FiHeart className='mx-auto text-gray-300 mb-3' size={48} />
                                <p className='text-gray-600 mb-4'>
                                    Your wishlist is empty. Tap the heart icon on any product to save it for later.
                                </p>
                                <Button asChild className='cursor-pointer'>
                                    <Link href={WEBSITE_SHOP}>Browse shop</Link>
                                </Button>
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
                                        <div key={item._id} className='border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition'>
                                            <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} className='block aspect-square bg-gray-50 relative'>
                                                <Image
                                                    src={media}
                                                    width={400}
                                                    height={400}
                                                    alt={product.name || 'Product'}
                                                    className='w-full h-full object-cover object-top'
                                                />
                                            </Link>
                                            <div className='p-3 flex flex-col flex-1'>
                                                <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} className='font-medium line-clamp-2 mb-1 hover:text-primary'>
                                                    {product.name || 'Product'}
                                                </Link>
                                                {variant && (variant.color || variant.size) && (
                                                    <p className='text-xs text-gray-500 mb-2'>
                                                        {[variant.color, variant.size].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                                <p className='flex gap-2 items-baseline text-sm mb-3'>
                                                    <span className='font-semibold'>{formatINR(sellingPrice)}</span>
                                                    {hasDiscount && (
                                                        <span className='line-through text-gray-400 text-xs'>{formatINR(mrp)}</span>
                                                    )}
                                                </p>
                                                <div className='mt-auto flex flex-col gap-1.5'>
                                                    <Button
                                                        type='button'
                                                        size='sm'
                                                        onClick={() => handleAddToCart(item)}
                                                        className='w-full cursor-pointer'
                                                    >
                                                        <BsCart2 size={14} className='mr-1' /> Add to cart
                                                    </Button>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='sm'
                                                        onClick={() => handleRemove(item)}
                                                        disabled={busyId === item._id}
                                                        className='w-full text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer'
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
