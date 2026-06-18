'use client'
import axios from '@/lib/apiClient'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import ProductBox from './ProductBox'
import AnimateIn from './AnimateIn'
import { ChevronRight } from 'lucide-react'

const CATEGORY_TABS = [
    { label: 'For All', value: 'all'   },
    { label: 'For Him', value: 'men'   },
    { label: 'For Her', value: 'women' },
]

const ProductSection = ({
    title,
    eyebrow,
    apiUrl,
    viewAllHref,
    viewAllLabel = 'View All',
    theme = 'dark',
    id,
    showCategoryTabs = false,
}) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('all')

    const effectiveApiUrl = activeCategory === 'all'
        ? apiUrl
        : `${apiUrl}&category=${activeCategory}`

    const effectiveViewAllHref = activeCategory === 'all'
        ? viewAllHref
        : `${viewAllHref}&category=${activeCategory}`

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            try {
                const { data } = await axios.get(effectiveApiUrl)
                if (data?.success) {
                    setProducts(data.data?.products ?? data.data ?? [])
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [effectiveApiUrl])

    // Reset tab when base URL changes
    useEffect(() => {
        setActiveCategory('all')
    }, [apiUrl])

    const isDark = theme === 'dark'

    return (
        <section
            id={id}
            className={`relative py-24 md:py-32 overflow-hidden ${isDark ? 'bg-charcoal-gold dot-pattern' : 'bg-ivory'}`}
        >
            {isDark ? (
                <>
                    <div className='absolute top-10 left-10 w-40 h-40 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none'></div>
                    <div className='absolute bottom-10 right-10 w-60 h-60 bg-[#F0D77C]/10 rounded-full blur-3xl pointer-events-none'></div>
                    <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-20 left-1/4 text-xl' style={{ animationDelay: '1s' }}>✦</span>
                    <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-32 right-1/3 text-lg' style={{ animationDelay: '2.5s' }}>✦</span>
                </>
            ) : (
                <>
                    <div className='absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B] pointer-events-none'></div>
                    <div className='absolute top-0 right-0 w-96 h-96 bg-[#C9A24B]/15 rounded-full blur-3xl pointer-events-none'></div>
                    <div className='absolute bottom-0 left-0 w-96 h-96 bg-[#F0D77C]/15 rounded-full blur-3xl pointer-events-none'></div>
                    <div className='absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B] pointer-events-none'></div>
                </>
            )}

            <div className='relative max-w-7xl mx-auto px-6'>

                {/* Section Header */}
                <AnimateIn direction="fade" className="text-center mb-10">
                    <div className={`flex items-center justify-center gap-3 ${isDark ? 'text-[#C9A24B]' : 'text-[#8a6d28]'}`}>
                        <span className={`h-px w-16 ${isDark ? 'bg-[#C9A24B]/50' : 'bg-[#8a6d28]/50'}`}></span>
                        <span className='text-xs'>❖</span>
                        <span className={`h-px w-16 ${isDark ? 'bg-[#C9A24B]/50' : 'bg-[#8a6d28]/50'}`}></span>
                    </div>
                    <div className={`text-[11px] tracking-[0.5em] uppercase mt-4 ${isDark ? 'text-[#F0D77C]' : 'text-[#8a6d28] font-semibold'}`}>
                        {eyebrow}
                    </div>
                    <h2 className={`font-serif-display text-5xl md:text-7xl mt-3 drop-shadow-[0_4px_20px_rgba(240,215,124,0.15)] ${isDark ? 'gold-shine' : 'gold-dark-text font-semibold'}`}>
                        {title}
                    </h2>
                </AnimateIn>

                {/* Category Tabs */}
                {showCategoryTabs && (
                    <div className='flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10'>
                        {CATEGORY_TABS.map((tab) => {
                            const isActive = activeCategory === tab.value
                            return (
                                <button
                                    key={tab.value}
                                    type='button'
                                    onClick={() => setActiveCategory(tab.value)}
                                    className={`px-5 sm:px-6 py-2 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-semibold transition-all duration-200 cursor-pointer ${
                                        isDark
                                            ? isActive
                                                ? 'bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-[#1a1208]'
                                                : 'border border-[#C9A24B]/35 text-white/60 hover:border-[#C9A24B]/70 hover:text-white/90'
                                            : isActive
                                                ? 'bg-[#1a1208] text-[#F0D77C]'
                                                : 'border border-[#8a6d28]/30 text-[#3a2a0a]/60 hover:border-[#8a6d28]/60 hover:text-[#3a2a0a]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Product Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
                    {loading && (
                        <div className={`col-span-3 text-center py-10 ${isDark ? 'text-white/60' : 'text-[#3a2a0a]/60'}`}>
                            Loading...
                        </div>
                    )}
                    {!loading && products.length === 0 && (
                        <div className={`col-span-3 text-center py-5 ${isDark ? 'text-white/60' : 'text-[#3a2a0a]/60'}`}>
                            No products found.
                        </div>
                    )}
                    {!loading && products.map((product, index) => (
                        <ProductBox key={product._id} product={product} index={index} />
                    ))}
                </div>

                {/* View All CTA */}
                <div className='mt-14 text-center'>
                    <Link
                        href={effectiveViewAllHref}
                        className={`inline-flex items-center gap-3 uppercase text-[11px] tracking-[0.35em] font-semibold px-10 py-4 transition ${
                            isDark
                                ? 'btn-dark-gold'
                                : 'bg-[#1a1208] text-[#F0D77C] hover:bg-[#2a1d0a] shadow-lg shadow-[#1a1208]/30'
                        }`}
                    >
                        {viewAllLabel} <ChevronRight size={14} />
                    </Link>
                </div>

            </div>
        </section>
    )
}

export default ProductSection
