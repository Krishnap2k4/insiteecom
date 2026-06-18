import axios from '@/lib/apiClient'
import { permanentRedirect } from 'next/navigation'
import React from 'react'
import ProductDetails from './ProductDetails'
import { getApiBaseUrl } from '@/lib/serverApiUrl'

/**
 * Product detail page.
 *
 * The URL shape is `/product/<slug>-<publicId>` (new) or `/product/<slug>`
 * (legacy, still resolved by the API). The API returns `canonicalUrl`
 * — when it differs from the requested path the page issues a 301 to
 * the canonical URL so search engines and shared links stay clean as
 * admins rename products.
 *
 * Any axis selection — color, size, or a custom attribute code — is
 * forwarded as a query parameter so the API can pick the matching
 * variant.
 */
const ProductNotFound = ({ slug }) => (
    <div className='flex justify-center items-center py-10 min-h-[400px] bg-dark-gold pt-[120px]'>
        <div className='text-center px-5'>
            <h1 className='font-serif-display text-4xl gold-shine'>Product Not Found</h1>
            <p className='text-white/50 mt-3 text-sm'>
                The fragrance you&apos;re looking for doesn&apos;t exist or has been removed{slug ? <> — <span className='font-mono text-[#F0D77C]'>{slug}</span></> : null}.
            </p>
        </div>
    </div>
)

const ProductPage = async ({ params, searchParams }) => {
    const { slug } = await params
    const sp = await searchParams

    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(sp || {})) {
        if (value !== undefined && value !== null && value !== '') {
            search.set(key, String(value))
        }
    }
    const qs = search.toString()

    // Defensive: if the API URL can't be resolved or the fetch fails,
    // render a graceful "not found" page instead of letting the error
    // bubble up to the storefront error boundary.
    let getProduct = null
    try {
        const baseUrl = await getApiBaseUrl()
        if (!baseUrl) throw new Error('API base URL unavailable')
        const url = `${baseUrl}/product/details/${slug}${qs ? `?${qs}` : ''}`
        const { data } = await axios.get(url)
        getProduct = data
    } catch (err) {
        console.error('[product/[slug]] fetch failed:', err?.message || err)
        return <ProductNotFound slug={slug} />
    }

    if (!getProduct?.success) {
        return <ProductNotFound slug={slug} />
    }

    if (getProduct?.data?.slugMismatch && getProduct?.data?.canonicalUrl) {
        const target = qs
            ? `${getProduct.data.canonicalUrl}?${qs}`
            : getProduct.data.canonicalUrl
        permanentRedirect(target)
    }

    return (
        <ProductDetails
            product={getProduct?.data?.product}
            variant={getProduct?.data?.variant}
            options={getProduct?.data?.options}
            selectionValues={getProduct?.data?.selectionValues}
            specifications={getProduct?.data?.specifications}
            axes={getProduct?.data?.axes}
            colors={getProduct?.data?.colors}
            sizes={getProduct?.data?.sizes}
            selection={sp || {}}
            reviewCount={getProduct?.data?.reviewCount}
        />
    )
}

export default ProductPage
