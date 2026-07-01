'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

/**
 * Hero carousel for the storefront home page.
 *
 * Each slide pairs a background image with optional copy and an
 * optional featured product card. The product card is rendered
 * *outside* the react-slick slider so we can re-trigger its slide-in
 * animation every time the active slide changes (slick's fade mode
 * keeps every slide mounted, so an in-slide card would only animate
 * once on initial mount).
 *
 * Image responsiveness:
 *   - Two <img> tags per slide — one shown via `hidden md:block`, the
 *     other via `md:hidden`. CSS picks the right one for each viewport.
 *     We use this instead of <picture> because react-slick's wrappers
 *     occasionally swallow <source> matching.
 *
 * Renders `null` when there are no usable slides.
 */
const HeroCarousel = ({ slides = [], autoplayMs = 5000 }) => {
    const sliderRef = useRef(null)
    const valid = slides.filter((s) => s && (s.imageUrl || s.mobileImageUrl || s.heading))
    const [activeIdx, setActiveIdx] = useState(0)
    // `entered` toggles false → true on each slide change so the
    // product card transitions in. CSS-transition-based so it works
    // regardless of how react-slick mounts/unmounts internally.
    //
    // Starts `true` so the product card is visible on the very first
    // paint (SSR/ISR hydration). The reset-then-animate cycle only
    // runs on *subsequent* slide changes.
    const [entered, setEntered] = useState(true)
    const isFirstMount = useRef(true)

    // On every active-slide change, snap back to the "from" state, wait
    // for two animation frames so the browser actually paints that state,
    // then flip on the entered class to trigger the CSS transition.
    // Single rAF is sometimes coalesced with the same paint as the state
    // update; double rAF guarantees a separate frame.
    //
    // On first mount we skip this entirely — the card should appear
    // immediately without any entrance delay.
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false
            return
        }
        setEntered(false)
        let raf2 = 0
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setEntered(true))
        })
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
        }
    }, [activeIdx])

    if (valid.length === 0) return null

    const settings = {
        infinite:      valid.length > 1,
        speed:         700,
        slidesToShow:  1,
        slidesToScroll:1,
        autoplay:      valid.length > 1 && autoplayMs > 0,
        autoplaySpeed: autoplayMs || 5000,
        pauseOnHover:  true,
        arrows:        false,
        dots:          false,
        fade:          true,
        cssEase:       'cubic-bezier(0.22, 0.61, 0.36, 1)',
        beforeChange:  (_oldIdx, newIdx) => setActiveIdx(newIdx),
    }

    const activeSlide = valid[activeIdx]
    const activeProduct = activeSlide?.product || null
    const activeProductUrl = activeProduct
        ? WEBSITE_PRODUCT_DETAILS(activeProduct.slug, activeProduct.publicId)
        : null

    return (
        <section id='top' className='relative bg-[#070707] overflow-hidden'>
            <Slider ref={sliderRef} {...settings}>
                {valid.map((slide, i) => (
                    <HeroSlide key={i} slide={slide} />
                ))}
            </Slider>

            {/* Featured product card — rendered OUTSIDE the slider. The
                CSS-transition pattern below (`hero-product-entered` on/off)
                replays the slide-in on every active-slide change:
                  mobile → slides up from below
                  ≥ md   → slides in from the right */}
            {activeProduct && (
                <div
                    className={`absolute z-20 bottom-12 right-4 left-4 sm:left-auto sm:bottom-24 sm:right-6 sm:w-[320px] lg:bottom-20 lg:right-10 lg:w-[360px] hero-product ${entered ? 'hero-product-entered' : ''} pointer-events-none`}
                >
                    <div className='pointer-events-auto'>
                        <FeaturedProductCard product={activeProduct} productUrl={activeProductUrl} />
                    </div>
                </div>
            )}

            {/* Carousel controls — only when there are multiple slides */}
            {valid.length > 1 && (
                <>
                    {/* Arrows — hidden on very small screens so they never
                        clash with the bottom product card */}
                    <button
                        type='button'
                        onClick={() => sliderRef.current?.slickPrev()}
                        className='hidden sm:flex absolute z-30 left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center border border-[#C9A24B]/40 bg-black/40 text-[#C9A24B] hover:bg-[#C9A24B]/20 hover:border-[#C9A24B] hover:text-[#F0D77C] backdrop-blur-sm transition-all duration-300 cursor-pointer'
                        aria-label='Previous slide'
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type='button'
                        onClick={() => sliderRef.current?.slickNext()}
                        className='hidden sm:flex absolute z-30 right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center border border-[#C9A24B]/40 bg-black/40 text-[#C9A24B] hover:bg-[#C9A24B]/20 hover:border-[#C9A24B] hover:text-[#F0D77C] backdrop-blur-sm transition-all duration-300 cursor-pointer'
                        aria-label='Next slide'
                    >
                        <ChevronRight size={18} />
                    </button>
                </>
            )}
        </section>
    )
}

/** A single slide — image + text only. Product card lives outside (see above). */
const HeroSlide = ({ slide }) => {
    const { imageUrl, mobileImageUrl, eyebrow, heading, subline, ctaLabel, ctaHref, product } = slide

    const productUrl = product
        ? WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)
        : null
    const finalCtaHref = productUrl || ctaHref || WEBSITE_SHOP

    // Prefer mobileImageUrl on small screens; fall back to desktop image
    // if no mobile variant is set. Either may be empty.
    const desktopSrc = imageUrl       || mobileImageUrl || ''
    const mobileSrc  = mobileImageUrl || imageUrl       || ''

    return (
        <div className='relative w-full min-h-[max(100vh,680px)] overflow-hidden'>

            {/* Background image — each viewport gets its own absolutely-
                positioned <img> in its own wrapper, with responsive
                show/hide on the WRAPPER (not the img itself). This avoids
                the `display: inline` quirk on bare imgs and guarantees
                full-bleed sizing in both viewports. */}
            {mobileSrc && (
                <div className='absolute inset-0 md:hidden'>
                    <img
                        src={mobileSrc}
                        alt={heading || ''}
                        className='block w-full h-full object-cover'
                        loading='eager'
                    />
                </div>
            )}
            {desktopSrc && (
                <div className='absolute inset-0 hidden md:block'>
                    <img
                        src={desktopSrc}
                        alt={heading || ''}
                        className='block w-full h-full object-cover'
                        loading='eager'
                    />
                </div>
            )}
            {!desktopSrc && !mobileSrc && (
                <div className='absolute inset-0 bg-gradient-to-br from-[#1a1208] via-[#2a1d0a] to-[#070707]' />
            )}

            {/* Legibility gradients */}
            <div className='absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/65' />
            <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070707]' />

            {/* Sparkles */}
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[20%] left-[12%] text-xl' style={{ animationDelay: '0s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[28%] right-[15%] text-base' style={{ animationDelay: '1.7s' }}>✦</span>

            {/* Text content — centered near the top. Padding clears nav (78px
                nav + ~32px marquee) and leaves room for the product card area. */}
            <div className='relative z-10 w-full max-w-[1100px] mx-auto px-5 sm:px-8 lg:px-12 pt-[140px] sm:pt-[160px] lg:pt-[180px] pb-[220px] sm:pb-[200px] lg:pb-[120px] text-center'>
                <div className='animate-hero' style={{ animationDelay: '0.1s' }}>
                    {eyebrow && (
                        <div className='flex items-center justify-center gap-3 mb-5'>
                            <span className='hidden sm:block h-px w-10 bg-gradient-to-r from-transparent to-[#C9A24B]' />
                            <span className='text-[#E5C76B] tracking-[0.5em] text-[10px] sm:text-[11px] uppercase'>{eyebrow}</span>
                            <span className='hidden sm:block h-px w-10 bg-gradient-to-l from-transparent to-[#C9A24B]' />
                        </div>
                    )}
                    {heading && (
                        <h1 className='font-serif-display gold-shine font-medium leading-[0.98] tracking-tight drop-shadow-[0_4px_30px_rgba(240,215,124,0.3)] text-[14vw] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[108px] pb-2'>
                            {heading}
                        </h1>
                    )}
                    {subline && (
                        <p className='font-serif-display italic text-white/85 text-base sm:text-lg md:text-xl mt-5 lg:mt-7 max-w-2xl mx-auto leading-snug'>
                            {subline}
                        </p>
                    )}
                    {ctaLabel && (
                        <div className='mt-7 lg:mt-10 flex justify-center'>
                            <Link
                                href={finalCtaHref}
                                className='btn-gold uppercase text-[11px] sm:text-[12px] tracking-[0.3em] font-semibold px-8 sm:px-10 py-3.5 sm:py-4'
                            >
                                {ctaLabel}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/** Compact product card overlaid on the slide. */
const FeaturedProductCard = ({ product, productUrl }) => {
    const imageSrc = product.media?.[0]?.secure_url || imgPlaceholder.src
    const discount = Number(product.discountPercentage) || 0
    return (
        <Link
            href={productUrl || WEBSITE_SHOP}
            className='group relative block bg-gradient-to-br from-[#0e0e0e]/95 via-[#15110a]/95 to-[#0e0e0e]/95 border border-[#C9A24B]/40 backdrop-blur-md card-glow transition-all overflow-hidden shadow-2xl shadow-black/50'
        >
            {/* Corner ornaments */}
            <span className='absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#C9A24B]/70 z-10 pointer-events-none' />
            <span className='absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#C9A24B]/70 z-10 pointer-events-none' />
            <span className='absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#C9A24B]/70 z-10 pointer-events-none' />
            <span className='absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#C9A24B]/70 z-10 pointer-events-none' />

            <div className='flex items-center gap-4 p-4 sm:p-5'>
                <div className='relative aspect-square w-20 sm:w-24 lg:w-28 shrink-0 border border-[#C9A24B]/30 overflow-hidden bg-black'>
                    <Image
                        src={imageSrc}
                        alt={product.name}
                        width={120}
                        height={120}
                        unoptimized
                        className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                    />
                </div>
                <div className='min-w-0 flex-1'>
                    {product.card?.badge ? (
                        <div className='inline-block text-[9px] tracking-[0.25em] uppercase font-bold text-black bg-gradient-to-r from-[#F0D77C] to-[#C9A24B] px-2 py-0.5 mb-2'>
                            {product.card.badge}
                        </div>
                    ) : (
                        <div className='text-[#F0D77C]/70 text-[10px] tracking-[0.3em] uppercase mb-1.5'>Featured</div>
                    )}
                    <div className='font-serif-display text-white text-base sm:text-lg lg:text-xl leading-tight truncate'>
                        {product.name}
                    </div>
                    <div className='flex items-baseline gap-2 mt-2'>
                        <span className='font-serif-display gold-text text-base sm:text-lg lg:text-xl'>
                            ₹{(Number(product.sellingPrice) || 0).toLocaleString('en-IN')}
                        </span>
                        {discount > 0 && Number(product.mrp) > Number(product.sellingPrice) && (
                            <span className='text-white/40 text-xs line-through'>
                                ₹{Number(product.mrp).toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    <div className='mt-2 sm:mt-3 text-[10px] tracking-[0.25em] uppercase text-[#E5C76B] group-hover:text-[#F0D77C] transition-colors'>
                        Shop now →
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default HeroCarousel
