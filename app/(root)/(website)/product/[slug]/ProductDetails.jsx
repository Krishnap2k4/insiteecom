'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { decode, encode } from "entities";
import { Minus, Plus, ShoppingBag, Loader2, Star, ChevronRight, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { useDispatch, useSelector } from "react-redux";
import { addToCartAsync } from "@/store/reducer/cartReducer";
import { showToast } from "@/lib/showToast";
import loadingSvg from '@/public/assets/images/loading.svg'
import ProductReveiw from "@/components/Application/Website/ProductReveiw";
import WishlistButton from "@/components/Application/Website/WishlistButton";

const ProductDetails = ({
    product, variant,
    options, selectionValues,
    specifications,
    axes, colors, sizes,
    selection, reviewCount,
}) => {

    const dispatch = useDispatch()
    const cartStore = useSelector(store => store.cartStore)

    const [activeThumb, setActiveThumb] = useState()
    const [qty, setQty] = useState(1)
    const [isAddedIntoCart, setIsAddedIntoCart] = useState(false)
    const [isProductLoading, setIsProductLoading] = useState(false)
    const [addingToCart, setAddingToCart] = useState(false)

    // Pricing falls back to product-level fields when no variant exists yet.
    const display = useMemo(() => ({
        mrp: variant?.mrp ?? product?.mrp ?? 0,
        sellingPrice: variant?.sellingPrice ?? product?.sellingPrice ?? 0,
        discountPercentage: variant?.discountPercentage ?? product?.discountPercentage ?? 0,
        media: (variant?.media?.length ? variant.media : product?.media) || [],
    }), [variant, product])

    const hasVariant = Boolean(variant)

    // Prefer the new product.options[] shape. Fall back to legacy
    // axes / colors / sizes for products not yet migrated.
    const resolvedOptions = useMemo(() => {
        if (Array.isArray(options) && options.length > 0) return options
        if (Array.isArray(axes) && axes.length > 0) {
            return axes.map((a) => ({ name: a.label || a.code, values: a.values }))
        }
        const fallback = []
        if (Array.isArray(colors) && colors.length > 0) {
            fallback.push({ name: 'Color', values: colors.map((c) => ({ value: c, label: c })) })
        }
        if (Array.isArray(sizes) && sizes.length > 0) {
            fallback.push({ name: 'Size', values: sizes.map((s) => ({ value: s, label: s })) })
        }
        return fallback
    }, [options, axes, colors, sizes])

    const optionKey = (name) => String(name || '').toLowerCase().replace(/\s+/g, '-')

    const valueForOption = (name) => {
        if (selectionValues && selectionValues[name]) return selectionValues[name]
        if (selection) {
            const fromQs = selection[optionKey(name)] ?? selection[name?.toLowerCase()]
            if (fromQs) return fromQs
        }
        if (Array.isArray(variant?.optionValues)) {
            const hit = variant.optionValues.find((ov) => ov.name === name)
            if (hit) return hit.value
        }
        if (/color/i.test(name)) return variant?.color || ''
        if (/size/i.test(name)) return variant?.size || ''
        return ''
    }

    const buildOptionUrl = (optionName, newValue) => {
        const params = new URLSearchParams()
        for (const opt of resolvedOptions) {
            const key = optionKey(opt.name)
            const cur = valueForOption(opt.name)
            if (cur) params.set(key, cur)
        }
        params.set(optionKey(optionName), newValue)
        const qs = params.toString()
        return `${WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)}${qs ? `?${qs}` : ''}`
    }

    useEffect(() => {
        setActiveThumb(display.media?.[0]?.secure_url)
    }, [display.media])

    useEffect(() => {
        if (!hasVariant) {
            setIsAddedIntoCart(false)
        } else if (cartStore.count > 0) {
            const existingProduct = cartStore.products.findIndex(
                (cartProduct) =>
                    cartProduct.productId === product._id &&
                    cartProduct.variantId === variant._id
            )
            setIsAddedIntoCart(existingProduct >= 0)
        } else {
            setIsAddedIntoCart(false)
        }
        setIsProductLoading(false)
    }, [variant, hasVariant, cartStore.count, cartStore.products, product._id])

    const handleThumb = (thumbUrl) => {
        setActiveThumb(thumbUrl)
    }

    const handleQty = (actionType) => {
        if (actionType === 'inc') {
            setQty(prev => prev + 1)
        } else {
            if (qty !== 1) {
                setQty(prev => prev - 1)
            }
        }
    }

    const handleAddToCart = async () => {
        if (!hasVariant) return
        setAddingToCart(true)
        try {
            const action = await dispatch(addToCartAsync({
                productId: product._id,
                variantId: variant._id,
                qty,
            }))
            if (action.error) throw new Error(action.error.message || 'Could not add to cart.')
            setIsAddedIntoCart(true)
            showToast('success', 'Product added into cart.')
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setAddingToCart(false)
        }
    }

    return (
        <div className="relative bg-dark-gold min-h-screen pt-[120px]">

            {/* Gold top bar */}
            <div className='h-px w-full bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>

            {isProductLoading &&
                <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className='flex flex-col items-center gap-3'>
                        <Loader2 size={40} className='text-[#C9A24B] animate-spin' />
                        <span className='text-white/60 text-sm'>Loading...</span>
                    </div>
                </div>
            }

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/" className="text-white/50 hover:text-[#F0D77C] text-xs tracking-wider uppercase transition-colors">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-[#C9A24B]/40"><ChevronRight size={12} /></BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={WEBSITE_SHOP} className="text-white/50 hover:text-[#F0D77C] text-xs tracking-wider uppercase transition-colors">Shop</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-[#C9A24B]/40"><ChevronRight size={12} /></BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={WEBSITE_PRODUCT_DETAILS(product?.slug, product?.publicId)} className="text-[#F0D77C] text-xs tracking-wider uppercase">{product?.name}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Main Product Section */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
                <div className="md:flex gap-10 lg:gap-14 items-start">

                    {/* Gallery */}
                    <div className="md:w-1/2 md:sticky md:top-4">
                        <div className='relative overflow-hidden border border-[#C9A24B]/30 bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] mb-4'>
                            <span className='absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-[#C9A24B]/50 z-10 pointer-events-none'></span>
                            <span className='absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-[#C9A24B]/50 z-10 pointer-events-none'></span>
                            <span className='absolute bottom-3 left-3 w-5 h-5 border-l-2 border-b-2 border-[#C9A24B]/50 z-10 pointer-events-none'></span>
                            <span className='absolute bottom-3 right-3 w-5 h-5 border-r-2 border-b-2 border-[#C9A24B]/50 z-10 pointer-events-none'></span>
                            <Image
                                src={activeThumb || imgPlaceholder.src}
                                width={650}
                                height={650}
                                alt="product"
                                className="w-full aspect-square object-contain p-6"
                            />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {display.media?.map((thumb) => (
                                <button
                                    key={thumb._id}
                                    type="button"
                                    className={`shrink-0 w-20 h-20 overflow-hidden border-2 cursor-pointer transition ${
                                        thumb.secure_url === activeThumb
                                            ? 'border-[#C9A24B] shadow-md shadow-[#C9A24B]/30'
                                            : 'border-[#C9A24B]/20 hover:border-[#C9A24B]/50'
                                    }`}
                                    onClick={() => handleThumb(thumb.secure_url)}
                                >
                                    <Image
                                        src={thumb?.secure_url || imgPlaceholder.src}
                                        width={80}
                                        height={80}
                                        alt="thumbnail"
                                        className='w-full h-full object-cover'
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="md:w-1/2 md:mt-0 mt-8">
                        <h1 className="font-serif-display text-4xl md:text-5xl text-white leading-tight">{product.name}</h1>

                        {/* Stars */}
                        <div className="flex items-center gap-2 mt-3">
                            <div className='flex items-center gap-0.5'>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={14} className='text-[#F0D77C] fill-[#F0D77C]' />
                                ))}
                            </div>
                            <span className="text-white/50 text-sm">({reviewCount} Reviews)</span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline gap-3 mt-5">
                            <span className="font-serif-display text-4xl gold-text">
                                {display.sellingPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                            {display.mrp > display.sellingPrice && (
                                <span className="text-sm line-through text-white/40">
                                    {display.mrp.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </span>
                            )}
                            {display.discountPercentage > 0 && (
                                <span className="bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                                    {display.discountPercentage}% Off
                                </span>
                            )}
                        </div>

                        {/* Description snippet */}
                        <div className="mt-5 text-white/65 text-sm leading-relaxed line-clamp-3 [&>*]:text-white/65" dangerouslySetInnerHTML={{ __html: decode(product.description) }}></div>

                        <div className='h-px w-full bg-gradient-to-r from-transparent via-[#C9A24B]/30 to-transparent my-6'></div>

                        {/* Options */}
                        {resolvedOptions.map((opt) => {
                            if (!opt.values || opt.values.length === 0) return null
                            const current = valueForOption(opt.name)
                            const isColorish = /color/i.test(opt.name)
                            return (
                                <div key={opt.name} className="mb-5">
                                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#F0D77C]/80 mb-3">
                                        <span className="font-semibold">{opt.name}:</span> <span className='text-white/60'>{current || '—'}</span>
                                    </p>
                                    <div className="flex gap-2.5 flex-wrap">
                                        {opt.values.map((v) => {
                                            const value = v.value ?? v
                                            const label = v.label ?? v
                                            const selected = current === value
                                            if (isColorish) {
                                                return (
                                                    <Link
                                                        key={value}
                                                        onClick={() => setIsProductLoading(true)}
                                                        href={buildOptionUrl(opt.name, value)}
                                                        title={label}
                                                        className={`min-w-[44px] h-11 px-3 inline-flex items-center gap-2 border cursor-pointer transition ${
                                                            selected
                                                                ? 'border-[#F0D77C] bg-[#C9A24B]/15 shadow-md shadow-[#C9A24B]/20'
                                                                : 'border-[#C9A24B]/30 hover:border-[#C9A24B]'
                                                        }`}
                                                    >
                                                        {/^#[0-9a-fA-F]{3,8}$/.test(value || '') && (
                                                            <span className='w-5 h-5 rounded-full border border-[#C9A24B]/30' style={{ backgroundColor: value }}></span>
                                                        )}
                                                        <span className='text-sm text-white/80'>{label}</span>
                                                    </Link>
                                                )
                                            }
                                            return (
                                                <Link
                                                    key={value}
                                                    onClick={() => setIsProductLoading(true)}
                                                    href={buildOptionUrl(opt.name, value)}
                                                    className={`border py-2 px-4 text-sm cursor-pointer transition ${
                                                        selected
                                                            ? 'border-[#F0D77C] bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black font-semibold shadow-md shadow-[#C9A24B]/30'
                                                            : 'border-[#C9A24B]/30 text-white/70 hover:border-[#C9A24B] hover:text-[#F0D77C]'
                                                    }`}
                                                >
                                                    {label}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Quantity */}
                        <div className="mb-6">
                            <p className="text-[10px] tracking-[0.3em] uppercase text-[#F0D77C]/80 mb-3">Quantity</p>
                            <div className="flex items-center h-12 border border-[#C9A24B]/30 w-fit">
                                <button type="button" className="h-full w-12 flex justify-center items-center cursor-pointer hover:bg-[#C9A24B]/15 transition text-white/70" onClick={() => handleQty('desc')} disabled={!hasVariant}>
                                    <Minus size={14} />
                                </button>
                                <span className="w-14 text-center text-[#F0D77C] font-medium">{qty}</span>
                                <button type="button" className="h-full w-12 flex justify-center items-center cursor-pointer hover:bg-[#C9A24B]/15 transition text-white/70" onClick={() => handleQty('inc')} disabled={!hasVariant}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart / Go to Cart / Out of Stock + Wishlist */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                {!hasVariant ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-4 text-center uppercase text-[11px] tracking-[0.3em] font-semibold border border-white/20 text-white/40 cursor-not-allowed"
                                    >
                                        Out of Stock
                                    </button>
                                ) : !isAddedIntoCart ? (
                                    <button
                                        type="button"
                                        onClick={handleAddToCart}
                                        disabled={addingToCart}
                                        className="w-full btn-gold uppercase text-[11px] tracking-[0.3em] font-bold py-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {addingToCart ? (
                                            <><Loader2 size={14} className='animate-spin' /> Adding...</>
                                        ) : (
                                            <><ShoppingBag size={16} /> Add to Cart</>
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        href={WEBSITE_CART}
                                        className="w-full btn-dark-gold uppercase text-[11px] tracking-[0.3em] font-semibold py-4 flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={16} /> Go to Cart
                                    </Link>
                                )}
                            </div>
                            <WishlistButton
                                productId={product._id}
                                variantId={variant?._id}
                                className="sm:w-auto w-full"
                            />
                        </div>

                        {!hasVariant && (
                            <p className="mt-3 text-sm text-white/40 text-center">
                                This product isn&apos;t available right now. Check back soon.
                            </p>
                        )}

                        {/* Trust badges */}
                        <div className='mt-8 grid grid-cols-3 gap-4'>
                            {[
                                { icon: Truck, label: 'Free Delivery', sub: 'Orders over ₹999' },
                                { icon: ShieldCheck, label: 'Authentic', sub: '100% Genuine' },
                                { icon: RotateCcw, label: 'Easy Returns', sub: '7-day policy' },
                            ].map((item) => (
                                <div key={item.label} className='text-center border border-[#C9A24B]/15 py-3 px-2'>
                                    <item.icon size={18} className='text-[#C9A24B] mx-auto mb-1.5' />
                                    <div className='text-[10px] text-white/70 font-medium'>{item.label}</div>
                                    <div className='text-[9px] text-white/40'>{item.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Description */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
                <div className="border border-[#C9A24B]/20 bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e]">
                    <div className="p-5 border-b border-[#C9A24B]/20 flex items-center gap-3">
                        <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                        <h2 className="text-[11px] tracking-[0.4em] uppercase text-[#F0D77C] font-semibold">Product Description</h2>
                        <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                    </div>
                    <div className="p-5 text-white/70 text-sm leading-relaxed [&>*]:text-white/70 [&_strong]:text-white/90 [&_b]:text-white/90" dangerouslySetInnerHTML={{ __html: decode(product.description) }}></div>
                </div>
            </div>

            {/* Specifications */}
            {(() => {
                const specs = Array.isArray(specifications) && specifications.length > 0
                    ? specifications
                    : (Array.isArray(product?.specifications) ? product.specifications : [])
                if (specs.length === 0) return null
                return (
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-10">
                        <div className="border border-[#C9A24B]/20 bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e]">
                            <div className="p-5 border-b border-[#C9A24B]/20 flex items-center gap-3">
                                <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                                <h2 className="text-[11px] tracking-[0.4em] uppercase text-[#F0D77C] font-semibold">Specifications</h2>
                                <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                            </div>
                            <div className="p-5">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {specs.map((row, i) => (
                                            <tr key={i} className="border-b border-[#C9A24B]/10 last:border-b-0">
                                                <td className="py-3 pr-4 text-[#F0D77C]/70 font-medium w-1/3 align-top text-xs uppercase tracking-wider">
                                                    {row.name}
                                                </td>
                                                <td className="py-3 text-white/70">{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Reviews */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-16">
                <ProductReveiw productId={product._id} />
            </div>
        </div>
    )
}

export default ProductDetails
