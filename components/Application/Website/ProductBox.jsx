'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import Link from 'next/link'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { useDispatch, useSelector } from 'react-redux'
import { addToCartAsync, updateCartQty, removeFromCartAsync } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'

const ProductBox = ({ product, index = 0 }) => {
    // Storefront card copy — all admin-editable via Products → Edit → "Storefront card".
    // Empty fields collapse on the card (no fallback brand-specific text).
    const card = product?.card || {}
    const badge         = card.badge?.trim() || ''
    const subtitle      = card.subtitle?.trim() || ''
    const audienceLabel = card.audienceLabel?.trim() || ''
    const sizeLabel     = card.sizeLabel?.trim() || ''
    const highlights    = Array.isArray(card.highlights) ? card.highlights.filter(Boolean) : []
    const bundleOffer   = card.bundleOffer?.trim() || ''

    const productUrl = WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)
    const dispatch = useDispatch()
    const router = useRouter()
    const [adding, setAdding] = useState(false)
    const [updating, setUpdating] = useState(false)

    const cartItem = useSelector(s => s.cartStore.products?.find(p => p.productId === product._id))
    const inCart = Boolean(cartItem)

    const handleAddToCart = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (adding) return

        // Fast path: the listing API already embeds the product's variants,
        // so we can grab the first variant id locally and skip the extra
        // /api/product/details fetch. This shaves a full network round-trip
        // off the click → "in cart" feedback.
        const firstVariantId = product.variants?.[0]?._id
        if (!firstVariantId) {
            // No variant info on this listing payload — fall back to the
            // product page so the user can choose options manually.
            router.push(productUrl)
            showToast('info', 'Please select options to add this product to your cart.')
            return
        }

        setAdding(true)
        try {
            const action = await dispatch(addToCartAsync({
                productId: product._id,
                variantId: firstVariantId,
                qty: 1,
            }))

            if (action.error) {
                showToast('error', action.error.message || 'Could not add to cart.')
            } else {
                showToast('success', `${product.name} added to cart!`)
            }
        } finally {
            setAdding(false)
        }
    }

    const handleDecrement = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (updating || !cartItem) return
        setUpdating(true)
        try {
            if (cartItem.qty <= 1) {
                await dispatch(removeFromCartAsync({ variantId: cartItem.variantId }))
            } else {
                await dispatch(updateCartQty({ variantId: cartItem.variantId, qty: cartItem.qty - 1 }))
            }
        } catch {
            showToast('error', 'Could not update cart.')
        } finally {
            setUpdating(false)
        }
    }

    const handleIncrement = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (updating || !cartItem) return
        setUpdating(true)
        try {
            await dispatch(updateCartQty({ variantId: cartItem.variantId, qty: cartItem.qty + 1 }))
        } catch {
            showToast('error', 'Could not update cart.')
        } finally {
            setUpdating(false)
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
                    {badge && (
                        <div className='absolute top-5 left-5 bg-gradient-to-r from-[#F0D77C] to-[#C9A24B] text-black text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1.5 shadow-lg shadow-[#C9A24B]/30'>
                            {badge}
                        </div>
                    )}

                    {/* Subtitle / descriptor overlay */}
                    {subtitle && (
                        <div className='absolute bottom-0 left-0 right-0 p-5'>
                            <div className='text-[10px] tracking-[0.35em] text-[#F0D77C] uppercase'>
                                {subtitle}
                            </div>
                        </div>
                    )}
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
                        {audienceLabel && (
                            <p className='text-white/55 text-[11px] tracking-[0.18em] mt-1 uppercase'>
                                {audienceLabel}
                            </p>
                        )}
                    </div>
                    {sizeLabel && (
                        <div className='text-right'>
                            <div className='text-[10px] text-[#F0D77C]/80 tracking-[0.3em] px-2 py-1 border border-[#C9A24B]/30'>
                                {sizeLabel}
                            </div>
                        </div>
                    )}
                </div>

                {/* Highlight chips */}
                {highlights.length > 0 && (
                    <div className='mt-4 flex flex-wrap gap-2'>
                        {highlights.map((tag) => (
                            <span key={tag} className='text-[10px] tracking-[0.2em] text-[#F0D77C]/80 uppercase border border-[#C9A24B]/25 bg-[#C9A24B]/5 px-2 py-1'>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Pricing + CTA */}
                <div className='mt-5 pt-4 border-t border-[#C9A24B]/15 flex items-end justify-between gap-3'>
                    <div>
                        <div className='text-[10px] text-white/50 uppercase tracking-[0.25em]'>Starting from</div>
                        <div className='font-serif-display text-3xl gold-text'>
                            ₹{product?.sellingPrice || 599}/-
                        </div>
                        {bundleOffer && (
                            <div className='text-[10px] text-[#F0D77C]/60 mt-1'>
                                {bundleOffer}
                            </div>
                        )}
                    </div>
                    {inCart ? (
                        <div className='flex items-center border border-[#C9A24B] bg-[#C9A24B]/10'>
                            <button
                                type='button'
                                onClick={handleDecrement}
                                disabled={updating}
                                className='text-[#F0D77C] font-bold text-base px-3 py-2.5 hover:bg-[#C9A24B]/20 transition-colors cursor-pointer disabled:opacity-50'
                                aria-label='Decrease quantity'
                            >
                                −
                            </button>
                            <span className='text-[#F0D77C] font-bold text-sm min-w-[1.75rem] text-center'>
                                {cartItem.qty}
                            </span>
                            <button
                                type='button'
                                onClick={handleIncrement}
                                disabled={updating}
                                className='text-[#F0D77C] font-bold text-base px-3 py-2.5 hover:bg-[#C9A24B]/20 transition-colors cursor-pointer disabled:opacity-50'
                                aria-label='Increase quantity'
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <button
                            type='button'
                            onClick={handleAddToCart}
                            disabled={adding}
                            className='btn-gold uppercase text-[10px] tracking-[0.25em] font-bold px-4 py-3 cursor-pointer disabled:opacity-50'
                        >
                            {adding ? 'Adding...' : 'Add to Cart →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductBox