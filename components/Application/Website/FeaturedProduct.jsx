'use client'
import axios from '@/lib/apiClient';
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import ProductBox from './ProductBox';
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute';
import { ChevronRight } from 'lucide-react';

const TABS = [
    { label: 'All', value: 'all' },
    { label: 'For Him', value: 'men' },
    { label: 'For Her', value: 'women' },
]

const FeaturedProduct = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            try {
                let url
                if (activeTab === 'all') {
                    url = '/api/product/get-featured-product'
                } else {
                    url = `/api/shop?limit=8&category=${activeTab}`
                }
                const { data } = await axios.get(url)
                if (data?.success) {
                    // Featured endpoint returns data.data (array)
                    // Shop endpoint returns data.data.products (array)
                    setProducts(data.data?.products ?? data.data ?? [])
                }
            } catch (error) {
                console.log(error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [activeTab])

    return (
        <section id="choice" className='relative bg-charcoal-gold dot-pattern py-24 md:py-32 overflow-hidden'>
            {/* Decorative glows */}
            <div className='absolute top-10 left-10 w-40 h-40 bg-[#C9A24B]/10 rounded-full blur-3xl'></div>
            <div className='absolute bottom-10 right-10 w-60 h-60 bg-[#F0D77C]/10 rounded-full blur-3xl'></div>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-20 left-1/4 text-xl' style={{ animationDelay: '1s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-32 right-1/3 text-lg' style={{ animationDelay: '2.5s' }}>✦</span>

            <div className='relative max-w-7xl mx-auto px-6'>
                {/* Section Header */}
                <div className='text-center mb-12'>
                    <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        <span className='text-xs'>❖</span>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                    </div>
                    <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>Curated Favorites</div>
                    <h2 className='font-serif-display gold-shine text-5xl md:text-7xl mt-3 drop-shadow-[0_4px_20px_rgba(240,215,124,0.15)]'>
                        People&apos;s Choice
                    </h2>

                    {/* Filter Tabs */}
                    <div className='mt-7 inline-flex gap-1 border border-[#C9A24B]/40 p-1 bg-black/40 backdrop-blur-sm'>
                        {TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type='button'
                                onClick={() => setActiveTab(tab.value)}
                                className={`px-6 py-2.5 text-[11px] tracking-[0.3em] uppercase transition cursor-pointer ${
                                    activeTab === tab.value
                                        ? 'bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black font-semibold shadow-md shadow-[#C9A24B]/30'
                                        : 'text-white/70 hover:text-[#F0D77C]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
                    {loading && (
                        <div className='col-span-3 text-center py-10 text-white/60'>Loading...</div>
                    )}
                    {!loading && products.length === 0 && (
                        <div className='col-span-3 text-center py-5 text-white/60'>Data Not Found.</div>
                    )}
                    {!loading && products.map((product, index) => (
                        <ProductBox key={product._id} product={product} index={index} />
                    ))}
                </div>

                {/* View All Button */}
                <div className='mt-14 text-center'>
                    <Link
                        href={activeTab === 'all' ? WEBSITE_SHOP : `${WEBSITE_SHOP}?category=${activeTab}`}
                        className='inline-flex items-center gap-3 btn-dark-gold uppercase text-[11px] tracking-[0.35em] font-semibold px-10 py-4 transition'
                    >
                        {activeTab === 'men' ? 'View All For Him' : activeTab === 'women' ? 'View All For Her' : 'View All Products'}
                        <ChevronRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default FeaturedProduct