'use client'
import Filter from '@/components/Application/Website/Filter'
import Sorting from '@/components/Application/Website/Sorting'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import React, { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import useWindowSize from '@/hooks/useWindowSize'
import axios from '@/lib/apiClient'
import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import ProductBox from '@/components/Application/Website/ProductBox'
import { ChevronDown, Loader2, PackageOpen } from 'lucide-react'

const Shop = () => {
    const searchParams = useSearchParams().toString()
    const [limit, setLimit] = useState(9)
    const [sorting, setSorting] = useState('default_sorting')
    const [isMobileFilter, setIsMobileFilter] = useState(false)
    const windowSize = useWindowSize()

    const fetchProduct = async (pageParam) => {
        const { data: getProduct } = await axios.get(`/api/shop?page=${pageParam}&limit=${limit}&sort=${sorting}&${searchParams}`)
        if (!getProduct.success) return
        return getProduct.data
    }

    const { error, data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ['products', limit, sorting, searchParams],
        queryFn: async ({ pageParam }) => await fetchProduct(pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    })

    return (
        <>
            {/* Hero */}
            <section className='relative min-h-[40vh] flex items-center justify-center overflow-hidden pt-[110px]'>
                <div className='absolute inset-0' style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544006593-1a0b9255782d?crop=entropy&cs=srgb&fm=jpg&q=85&w=2200')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className='absolute inset-0 bg-black/60'></div>
                    <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-[#1a1208]/40 to-[#070707]'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.10),transparent_70%)]'></div>
                </div>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[30%] left-[20%] text-xl' style={{ animationDelay: '0s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[20%] right-[15%] text-lg' style={{ animationDelay: '1.5s' }}>✦</span>

                <div className='relative z-10 text-center px-6'>
                    <div className='flex items-center justify-center gap-3 mb-4'>
                        <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]'></span>
                        <span className='text-[#E5C76B] tracking-[0.5em] text-[11px] uppercase'>Eloir Collection</span>
                        <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]'></span>
                    </div>
                    <h1 className='font-serif-display gold-shine text-5xl md:text-7xl'>
                        Our Fragrances
                    </h1>
                    <p className='font-serif-display italic text-white/70 text-lg mt-4 max-w-xl mx-auto'>
                        Discover your signature scent from our curated collection
                    </p>
                </div>
            </section>

            {/* Shop Content */}
            <section className='relative bg-dark-gold py-10 md:py-16'>
                <div className='max-w-[1400px] mx-auto px-4 lg:px-8 lg:flex gap-6'>
                    {/* Desktop Filter */}
                    {windowSize.width > 1024 ? (
                        <div className='w-72 shrink-0'>
                            <div className='sticky top-4 bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] border border-[#C9A24B]/20 p-5'>
                                <h3 className='text-[11px] tracking-[0.4em] uppercase text-[#F0D77C] font-semibold mb-4 flex items-center gap-2'>
                                    <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                                    Refine By
                                    <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                                </h3>
                                <Filter />
                            </div>
                        </div>
                    ) : (
                        <Sheet open={isMobileFilter} onOpenChange={() => setIsMobileFilter(false)}>
                            <SheetContent side='left' className="bg-[#0a0805] border-r border-[#C9A24B]/30 text-white">
                                <SheetHeader className="border-b border-[#C9A24B]/20 pb-3">
                                    <SheetTitle className="text-white font-serif-display text-xl">Refine By</SheetTitle>
                                    <SheetDescription className="text-white/50 text-xs">Filter products to find your perfect scent</SheetDescription>
                                </SheetHeader>
                                <div className='p-4 overflow-auto h-[calc(100vh-80px)]'>
                                    <Filter />
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Product Grid Area */}
                    <div className='flex-1 min-w-0'>
                        <Sorting
                            limit={limit}
                            setLimit={setLimit}
                            sorting={sorting}
                            setSorting={setSorting}
                            mobileFilterOpen={isMobileFilter}
                            setMobileFilterOpen={setIsMobileFilter}
                        />

                        {isFetching && !data && (
                            <div className='py-20 text-center'>
                                <Loader2 size={32} className='text-[#C9A24B] animate-spin mx-auto mb-3' />
                                <p className='text-white/60 text-sm'>Loading fragrances...</p>
                            </div>
                        )}
                        {error && (
                            <div className='py-16 text-center'>
                                <p className='text-red-400 font-medium'>{error.message}</p>
                            </div>
                        )}

                        <div className='grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 mt-8'>
                            {data && data.pages.map(page => (
                                page.products.map((product, i) => (
                                    <ProductBox key={product._id} product={product} index={i} />
                                ))
                            ))}
                        </div>

                        {/* Load More / End */}
                        <div className='mt-12 text-center'>
                            {hasNextPage ? (
                                <button
                                    type="button"
                                    onClick={fetchNextPage}
                                    disabled={isFetching}
                                    className='btn-dark-gold uppercase text-[11px] tracking-[0.3em] font-semibold px-10 py-4 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50'
                                >
                                    {isFetching ? (
                                        <><Loader2 size={14} className='animate-spin' /> Loading...</>
                                    ) : (
                                        <><ChevronDown size={14} /> Load More</>
                                    )}
                                </button>
                            ) : (
                                <>
                                    {!isFetching && data && (
                                        <div className='flex items-center justify-center gap-3 text-white/40 py-4'>
                                            <span className='h-px w-10 bg-[#C9A24B]/30'></span>
                                            <PackageOpen size={16} className='text-[#C9A24B]/50' />
                                            <span className='text-xs tracking-wider'>You&apos;ve seen it all</span>
                                            <span className='h-px w-10 bg-[#C9A24B]/30'></span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Shop