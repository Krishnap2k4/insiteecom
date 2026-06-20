'use client'
import Filter from '@/components/Application/Website/Filter'
import Sorting from '@/components/Application/Website/Sorting'
import Pagination from '@/components/Application/Website/Pagination'
import React, { useEffect, useRef, useState } from 'react'
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
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import ProductBox from '@/components/Application/Website/ProductBox'
import { Loader2, PackageOpen } from 'lucide-react'

const PAGE_SIZE = 12

const Shop = () => {
    const searchParams = useSearchParams().toString()
    const [page, setPage] = useState(0)
    const [sorting, setSorting] = useState('default_sorting')
    const [isMobileFilter, setIsMobileFilter] = useState(false)
    const windowSize = useWindowSize()
    const gridTopRef = useRef(null)

    // Reset to first page whenever filters or sort change.
    useEffect(() => { setPage(0) }, [sorting, searchParams])

    const { data, error, isFetching } = useQuery({
        queryKey: ['products', PAGE_SIZE, sorting, searchParams, page],
        queryFn: async () => {
            const { data: res } = await axios.get(`/api/shop?page=${page}&limit=${PAGE_SIZE}&sort=${sorting}&${searchParams}`)
            if (!res?.success) throw new Error(res?.message || 'Could not load products.')
            return res.data
        },
        placeholderData: keepPreviousData,
    })

    const products   = data?.products ?? []
    const totalPages = data?.totalPages ?? 0
    const total      = data?.total ?? 0

    const handlePageChange = (next) => {
        setPage(next)
        // Scroll back to the top of the grid so users see the new page.
        gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <>
            {/* Hero */}
            <section className='relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-[110px]'>
                <div className='absolute inset-0' style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544006593-1a0b9255782d?crop=entropy&cs=srgb&fm=jpg&q=85&w=2200')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className='absolute inset-0 bg-black/65'></div>
                    <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-[#1a1208]/40 to-[#070707]'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.12),transparent_70%)]'></div>
                </div>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[30%] left-[20%] text-xl' style={{ animationDelay: '0s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[20%] right-[15%] text-lg' style={{ animationDelay: '1.5s' }}>✦</span>

                <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent pointer-events-none'></div>
                <div className='relative z-10 text-center px-6 max-w-4xl'>
                    <div className='flex items-center justify-center gap-3 mb-5'>
                        <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]'></span>
                        <span className='text-[#E5C76B] tracking-[0.5em] text-[11px] uppercase'>Eloir Collection</span>
                        <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]'></span>
                    </div>
                    <h1 className='font-serif-display gold-shine text-6xl md:text-8xl leading-[0.95] tracking-tight pb-4'>
                        Our Fragrances
                    </h1>
                    <p className='font-serif-display italic text-white/80 text-lg md:text-xl mt-6 max-w-2xl mx-auto'>
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
                                {/* `100dvh` matches the iOS Safari visible
                                    viewport so the filter scroll area
                                    doesn't extend behind the bottom bar. */}
                                <div className='p-4 overflow-auto h-[calc(100dvh-80px)]'>
                                    <Filter />
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Product Grid Area */}
                    <div className='flex-1 min-w-0' ref={gridTopRef}>
                        <Sorting
                            sorting={sorting}
                            setSorting={setSorting}
                            mobileFilterOpen={isMobileFilter}
                            setMobileFilterOpen={setIsMobileFilter}
                            total={total}
                            page={page}
                            pageSize={PAGE_SIZE}
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

                        <div className={`grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 mt-8 transition-opacity ${isFetching && data ? 'opacity-60' : 'opacity-100'}`}>
                            {products.map((product, i) => (
                                <ProductBox key={product._id} product={product} index={i} />
                            ))}
                        </div>

                        {!isFetching && data && products.length === 0 && (
                            <div className='py-16 text-center'>
                                <div className='flex items-center justify-center gap-3 text-white/40'>
                                    <span className='h-px w-10 bg-[#C9A24B]/30'></span>
                                    <PackageOpen size={18} className='text-[#C9A24B]/50' />
                                    <span className='text-xs tracking-wider uppercase'>No products match these filters</span>
                                    <span className='h-px w-10 bg-[#C9A24B]/30'></span>
                                </div>
                            </div>
                        )}

                        {/* Numbered pagination */}
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            disabled={isFetching}
                            className='mt-12'
                        />
                    </div>
                </div>
            </section>
        </>
    )
}

export default Shop