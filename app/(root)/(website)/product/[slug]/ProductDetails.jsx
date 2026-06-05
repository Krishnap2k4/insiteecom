'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { IoStar } from "react-icons/io5";
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { decode, encode } from "entities";
import { HiMinus, HiPlus } from "react-icons/hi2";
import ButtonLoading from "@/components/Application/ButtonLoading";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAsync } from "@/store/reducer/cartReducer";
import { showToast } from "@/lib/showToast";
import { Button } from "@/components/ui/button";
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

    /**
     * URL-safe key for an option (the query-string parameter the
     * server reads back to resolve the variant).
     */
    const optionKey = (name) => String(name || '').toLowerCase().replace(/\s+/g, '-')

    /**
     * Currently-selected value for one option — prefers `selectionValues`
     * computed server-side, then a direct match on the URL `selection`,
     * then the variant's stored optionValues, then legacy color/size.
     */
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

    /**
     * Build the URL for switching one option's value, preserving the
     * current selection on all other options.
     */
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
        }
    }

    return (
        <div className="lg:px-32 px-4">

            {isProductLoading &&
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50">
                    <Image src={loadingSvg} width={80} height={80} alt="Loading" />
                </div>
            }

            <div className="my-10">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={WEBSITE_SHOP}>Product</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={WEBSITE_PRODUCT_DETAILS(product?.slug, product?.publicId)}>{product?.name} </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="md:flex justify-between items-start lg:gap-10 gap-5 mb-20">
                <div className="md:w-1/2 xl:flex xl:justify-center xl:gap-5 md:sticky md:top-0">
                    <div className="xl:order-last xl:mb-0 mb-5 xl:w-[calc(100%-144px)]">
                        <Image
                            src={activeThumb || imgPlaceholder.src}
                            width={650}
                            height={650}
                            alt="product"
                            className="border rounded max-w-full"
                        />
                    </div>
                    <div className="flex xl:flex-col items-center xl:gap-5 gap-3 xl:w-36 overflow-auto xl:pb-0 pb-2 max-h-[600px]">
                        {display.media?.map((thumb) => (
                            <Image
                                key={thumb._id}
                                src={thumb?.secure_url || imgPlaceholder.src}
                                width={100}
                                height={100}
                                alt="product thumbnail"
                                className={`md:max-w-full max-w-16 rounded cursor-pointer ${thumb.secure_url === activeThumb ? 'border-2 border-primary' : 'border'}`}
                                onClick={() => handleThumb(thumb.secure_url)}
                            />
                        ))}
                    </div>
                </div>

                <div className="md:w-1/2 md:mt-0 mt-5">
                    <h1 className="text-3xl font-semibold mb-2">{product.name}</h1>
                    <div className="flex items-center gap-1 mb-5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <IoStar key={i} />
                        ))}
                        <span className="text-sm ps-2">({reviewCount} Reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-semibold">{display.sellingPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        <span className="text-sm line-through text-gray-500">{display.mrp.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>


                        <span className="bg-red-500 rounded-2xl px-3 py-1 text-white text-xs ms-5">-{display.discountPercentage}%</span>


                    </div>

                    <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: decode(product.description) }}></div>


                    {resolvedOptions.map((opt) => {
                        if (!opt.values || opt.values.length === 0) return null
                        const current = valueForOption(opt.name)
                        const isColorish = /color/i.test(opt.name)
                        return (
                            <div key={opt.name} className="mt-5">
                                <p className="mb-2">
                                    <span className="font-semibold">{opt.name}: </span> {current || <span className='text-gray-400'>—</span>}
                                </p>
                                <div className="flex gap-3 flex-wrap">
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
                                                    className={`min-w-[44px] h-11 px-3 inline-flex items-center gap-2 border rounded-full cursor-pointer hover:border-primary transition ${selected ? 'border-primary ring-2 ring-primary/30' : ''}`}
                                                >
                                                    {/^#[0-9a-fA-F]{3,8}$/.test(value || '') && (
                                                        <span className='w-5 h-5 rounded-full border' style={{ backgroundColor: value }}></span>
                                                    )}
                                                    <span className='text-sm'>{label}</span>
                                                </Link>
                                            )
                                        }
                                        return (
                                            <Link
                                                key={value}
                                                onClick={() => setIsProductLoading(true)}
                                                href={buildOptionUrl(opt.name, value)}
                                                className={`border py-1 px-3 rounded-lg cursor-pointer hover:bg-primary hover:text-white transition ${selected ? 'bg-primary text-white border-primary' : ''}`}
                                            >
                                                {label}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    <div className="mt-5">
                        <p className="font-bold mb-2">Quantity</p>
                        <div className="flex items-center h-10 border w-fit rounded-full">

                            <button type="button" className="h-full w-10 flex justify-center items-center" onClick={() => handleQty('desc')} disabled={!hasVariant}>
                                <HiMinus />
                            </button>
                            <input type="text" value={qty} className="w-14 text-center border-none outline-offset-0" readOnly />
                            <button type="button" className="h-full w-10 flex justify-center items-center" onClick={() => handleQty('inc')} disabled={!hasVariant}>
                                <HiPlus />
                            </button>

                        </div>
                    </div>


                    <div className="mt-5">
                        <div className="flex sm:flex-row flex-col gap-3">
                            <div className="flex-1">
                                {!hasVariant ? (
                                    <Button
                                        className="w-full rounded-full py-6 text-md cursor-not-allowed opacity-70"
                                        type="button"
                                        disabled
                                    >
                                        Out of stock
                                    </Button>
                                ) : !isAddedIntoCart ? (
                                    <ButtonLoading type="button" text="Add To Cart" className="w-full rounded-full py-6 text-md cursor-pointer" onClick={handleAddToCart} />
                                ) : (
                                    <Button className="w-full rounded-full py-6 text-md cursor-pointer" type="button" asChild>
                                        <Link href={WEBSITE_CART}>Go To Cart</Link>
                                    </Button>
                                )}
                            </div>
                            <WishlistButton
                                productId={product._id}
                                variantId={variant?._id}
                                className="sm:w-auto w-full"
                            />
                        </div>

                        {!hasVariant && (
                            <p className="mt-3 text-sm text-gray-500 text-center">
                                This product isn&apos;t available right now. Check back soon.
                            </p>
                        )}


                    </div>

                </div>
            </div>


            <div className="mb-10">
                <div className="shadow rounded border">
                    <div className="p-3 bg-gray-50 border-b">
                        <h2 className="font-semibold text-2xl">Product Description</h2>
                    </div>
                    <div className="p-3">
                        <div dangerouslySetInnerHTML={{ __html: encode(product.description) }}></div>
                    </div>
                </div>
            </div>

            {(() => {
                const specs = Array.isArray(specifications) && specifications.length > 0
                    ? specifications
                    : (Array.isArray(product?.specifications) ? product.specifications : [])
                if (specs.length === 0) return null
                return (
                    <div className="mb-10">
                        <div className="shadow rounded border">
                            <div className="p-3 bg-gray-50 border-b">
                                <h2 className="font-semibold text-2xl">Specifications</h2>
                            </div>
                            <div className="p-3">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {specs.map((row, i) => (
                                            <tr key={i} className="border-b last:border-b-0">
                                                <td className="py-2 pr-4 text-gray-500 font-medium w-1/3 align-top">
                                                    {row.name}
                                                </td>
                                                <td className="py-2">{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            })()}

            <ProductReveiw productId={product._id} />

        </div>
    )
}

export default ProductDetails
