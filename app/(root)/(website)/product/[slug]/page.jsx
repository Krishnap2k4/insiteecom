import { permanentRedirect } from 'next/navigation'
import React from 'react'
import ProductDetails from './ProductDetails'
import { getProductDetails } from '@/lib/data/productDetails'

const ProductNotFound = ({ slug }) => (
    <div className='flex justify-center items-center py-10 min-h-[400px] bg-dark-gold pt-[120px]'>
        <div className='text-center px-5'>
            <h1 className='font-serif-display text-4xl gold-shine'>Product Not Found</h1>
            <p className='text-white/50 mt-3 text-sm'>
                The product you&apos;re looking for doesn&apos;t exist or has been removed{slug ? <> — <span className='font-mono text-[#F0D77C]'>{slug}</span></> : null}.
            </p>
        </div>
    </div>
)

/**
 * Product detail page — calls the data layer DIRECTLY (no HTTP loopback
 * to /api/product/details). That eliminates a whole class of
 * production-only failure modes (env-var dependent URL construction,
 * cookie forwarding, internal/public host mismatches).
 */
const ProductPage = async ({ params, searchParams }) => {
    const { slug } = await params
    const sp = await searchParams

    // Flatten searchParams (which may contain arrays) into a plain
    // string-keyed object — the data helper accepts that shape.
    const queryParams = {}
    for (const [k, v] of Object.entries(sp || {})) {
        if (v !== undefined && v !== null && v !== '') {
            queryParams[k] = Array.isArray(v) ? v[0] : String(v)
        }
    }

    const result = await getProductDetails(slug, queryParams)
    if (!result.ok) {
        return <ProductNotFound slug={slug} />
    }

    const data = result.data

    if (data.slugMismatch && data.canonicalUrl) {
        const qs = new URLSearchParams(queryParams).toString()
        permanentRedirect(qs ? `${data.canonicalUrl}?${qs}` : data.canonicalUrl)
    }

    return (
        <ProductDetails
            product={data.product}
            variant={data.variant}
            options={data.options}
            selectionValues={data.selectionValues}
            specifications={data.specifications}
            axes={data.axes}
            colors={data.colors}
            sizes={data.sizes}
            selection={sp || {}}
            reviewCount={data.reviewCount}
        />
    )
}

export default ProductPage
