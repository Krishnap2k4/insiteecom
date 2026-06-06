'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import Link from 'next/link'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { useDispatch } from 'react-redux'
import { addToCartAsync } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'
import axios from '@/lib/apiClient'

/**
 * Static fallback data for ELOIR card fields not present in backend.
 * Rotated by product index for visual variety.
 */
const STATIC_EXTRAS = [
    { badge: 'BEST SELLER', scentNotes: 'Fresh • Aquatic • Citrus', category: 'For Him & For Her', size: '50ML', tags: ['Bergamot', 'Sea Salt', 'White Musk'], bundle: 'Buy 3 at ₹1599/-' },
    { badge: null, scentNotes: 'Cool • Mysterious • Deep', category: 'For Him', size: '50ML', tags: ['Iris', 'Vetiver', 'Amber'], bundle: 'Buy 3 at ₹1599/-' },
    { badge: null, scentNotes: 'Spicy • Bold • Magnetic', category: 'For Him', size: '50ML', tags: ['Cardamom', 'Leather', 'Tobacco'], bundle: 'Buy 3 at ₹1599/-' },
    { badge: null, scentNotes: 'Floral • Soft • Romantic', category: 'For Her', size: '50ML', tags: ['Rose', 'Peony', 'Sandalwood'], bundle: 'Buy 3 at ₹1599/-' },
    { badge: null, scentNotes: 'Gourmand • Sweet • Addictive', category: 'For Her', size: '50ML', tags: ['Vanilla', 'Praline', 'Cocoa'], bundle: 'Buy 3 at ₹1599/-' },
    { badge: 'PREMIUM', scentNotes: 'Oriental • Warm • Regal', category: 'Unisex', size: '50ML', tags: ['Saffron', 'Rose', 'Oud'], bundle: 'Buy 3 at ₹2099/-' },
]

const ProductBox = ({ product, index = 0 }) => {
    const extras = STATIC_EXTRAS[index % STATIC_EXTRAS.length]
    const productUrl = WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)
    const dispatch = useDispatch()
    const router = useRouter()
    const [adding, setAdding] = useState(false)

    const handleAddToCart = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (adding) return
        setAdding(true)

        try {
            // Use the existing product detail API to get the first variant
            const slug = product.publicId
                ? `${product.slug}-${product.publicId}`
                : product.slug
            const { data: res } = await axios.get(`/api/product/details/${slug}`)
            const variant = res?.data?.variant

            if (!variant?._id) {
                router.push(productUrl)
                showToast('info', 'Please select options to add this product to your cart.')
                return
            }

            const action = await dispatch(addToCartAsync({
                productId: product._id,
                variantId: variant._id,
                qty: 1,
            }))

            if (action.error) {
                showToast('error', action.error.message || 'Could not add to cart.')
            } else {
                showToast('success', `${product.name} added to cart!`)
            }
        } catch {
            router.push(productUrl)
            showToast('info', 'Please select options to add this product to your cart.')
        } finally {
            setAdding(false)
        }
    }

    return (
        <div className='group relative bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] border border-[#C9A24B]/20 card-glow transition-all overflow-hidden'>
            {/* Corner ornaments */}
            <span className='absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-[#C9A24B]/70 z-10 pointer-events-none'></span>
            <span className='absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-[#C9A24B]/70 z-10 pointer-events-none'></span>
            <span className='absolute bottom-3 left-3 w-5 h-5 border-l-2 border-b-2 border-[#C9A24B]/70 z-10 pointer-events-none'></span>
            <span className='absolute bottom-3 right-3 w-5 h-5 border-r-2 border-b-2 border-[#C9A24B]/70 z-10 pointer-events-none'></span>

            {/* Product Image — clickable to product page */}
            <Link href={productUrl}>
                <div className='relative aspect-[4/5] overflow-hidden'>
                    <Image
                        src={product?.media[0]?.secure_url || imgPlaceholder.src}
                        width={400}
                        height={500}
                        alt={product?.media[0]?.alt || product?.name}
                        title={product?.media[0]?.title || product?.name}
                        className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent'></div>
                    <div className='absolute inset-0 bg-gradient-to-br from-[#C9A24B]/0 via-transparent to-[#C9A24B]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                    {/* Badge */}
                    {extras.badge && (
                        <div className='absolute top-5 left-5 bg-gradient-to-r from-[#F0D77C] to-[#C9A24B] text-black text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1.5 shadow-lg shadow-[#C9A24B]/30'>
                            {extras.badge}
                        </div>
                    )}

                    {/* Scent notes overlay */}
                    <div className='absolute bottom-0 left-0 right-0 p-5'>
                        <div className='text-[10px] tracking-[0.35em] text-[#F0D77C] uppercase'>
                            {extras.scentNotes}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Product Info */}
            <div className='p-5 md:p-6 relative'>
                <div className='flex justify-between items-start gap-3'>
                    <div>
                        <Link href={productUrl}>
                            <h3 className='font-serif-display text-2xl md:text-[28px] text-white leading-tight hover:text-[#F0D77C] transition-colors'>
                                {product?.name}
                            </h3>
                        </Link>
                        <p className='text-white/55 text-[11px] tracking-[0.18em] mt-1 uppercase'>
                            {extras.category}
                        </p>
                    </div>
                    <div className='text-right'>
                        <div className='text-[10px] text-[#F0D77C]/80 tracking-[0.3em] px-2 py-1 border border-[#C9A24B]/30'>
                            {extras.size}
                        </div>
                    </div>
                </div>

                {/* Note Tags */}
                <div className='mt-4 flex flex-wrap gap-2'>
                    {extras.tags.map((tag) => (
                        <span key={tag} className='text-[10px] tracking-[0.2em] text-[#F0D77C]/80 uppercase border border-[#C9A24B]/25 bg-[#C9A24B]/5 px-2 py-1'>
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Pricing + CTA */}
                <div className='mt-5 pt-4 border-t border-[#C9A24B]/15 flex items-end justify-between gap-3'>
                    <div>
                        <div className='text-[10px] text-white/50 uppercase tracking-[0.25em]'>Starting from</div>
                        <div className='font-serif-display text-3xl gold-text'>
                            ₹{product?.sellingPrice || 599}/-
                        </div>
                        <div className='text-[10px] text-[#F0D77C]/60 mt-1'>
                            {extras.bundle}
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={handleAddToCart}
                        disabled={adding}
                        className='btn-gold uppercase text-[10px] tracking-[0.25em] font-bold px-4 py-3 cursor-pointer disabled:opacity-50'
                    >
                        {adding ? 'Adding...' : 'Add to Cart →'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductBox