'use client'
import React, { useRef } from 'react'
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const SLIDER_SETTINGS = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    responsive: [
        { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
        { breakpoint: 640,  settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
}

const Testimonial = () => {
    const sliderRef = useRef(null)
    const { sections } = useSiteSettings()
    const cfg = sections?.testimonials || {}

    // Hide entirely if disabled OR no items have been curated.
    // Brand-neutral default: rather than ship a placeholder list with
    // someone else's brand, we just don't render until the admin adds
    // their own testimonials.
    const testimonials = cfg.items || []
    if (cfg.enabled === false || testimonials.length === 0) return null

    // With fewer items than the slider wants to show, force `infinite: false`
    // so react-slick doesn't visually clone cards and look like duplicates.
    const sliderSettings = testimonials.length <= 3
        ? { ...SLIDER_SETTINGS, infinite: false, slidesToShow: Math.min(3, testimonials.length) }
        : SLIDER_SETTINGS

    return (
        <section className='relative bg-wine py-20 md:py-28 overflow-hidden'>
            {/* Decorative elements */}
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>
            <div className='absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A24B]/15 rounded-full blur-3xl'></div>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-1/4 left-[8%] text-2xl' style={{ animationDelay: '0.5s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-1/3 right-[10%] text-xl' style={{ animationDelay: '2.5s' }}>✦</span>

            <div className='relative max-w-6xl mx-auto px-6'>
                {/* Section Header */}
                <div className='text-center mb-14'>
                    <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        <span className='text-xs'>❖</span>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                    </div>
                    <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>{cfg.eyebrow || 'Voices of Eloir'}</div>
                    <h2 className='font-serif-display gold-shine text-5xl md:text-6xl mt-3 pb-2'>{cfg.heading || 'Loved By Many'}</h2>
                </div>

                {/* Carousel */}
                <div className='relative'>
                    {/* Prev */}
                    <button
                        type='button'
                        onClick={() => sliderRef.current?.slickPrev()}
                        className='absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center border border-[#C9A24B]/40 bg-black/60 text-[#C9A24B] hover:bg-[#C9A24B]/15 hover:border-[#C9A24B] hover:text-[#F0D77C] transition-all duration-300 cursor-pointer'
                        aria-label='Previous'
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <Slider
                        ref={sliderRef}
                        {...sliderSettings}
                        className='[&_.slick-track]:!flex [&_.slick-track]:!items-stretch [&_.slick-slide]:!h-auto [&_.slick-slide>div]:!h-full'
                    >
                        {testimonials.map((item, index) => (
                            <div key={index} className='px-3 h-full'>
                                <div className='relative bg-gradient-to-br from-[#1a0a0d] to-[#2a1208] border border-[#C9A24B]/30 p-8 hover:border-[#F0D77C] transition card-glow h-full'>
                                    <Quote size={32} className='text-[#C9A24B]/60 absolute top-5 right-5' />

                                    {/* Stars */}
                                    <div className='flex gap-1 mb-4'>
                                        {Array.from({ length: Math.max(0, Math.min(5, Number(item.rating) || 5)) }).map((_, i) => (
                                            <Star key={`star${i}`} size={14} className='fill-[#F0D77C] text-[#F0D77C]' />
                                        ))}
                                    </div>

                                    <p className='font-serif-display italic text-white/85 text-lg leading-relaxed'>
                                        &ldquo;{item.review}&rdquo;
                                    </p>

                                    <div className='mt-6 pt-5 border-t border-[#C9A24B]/20'>
                                        <div className='text-[#F0D77C] font-semibold tracking-wider'>{item.name}</div>
                                        {item.location && (
                                            <div className='text-white/50 text-xs uppercase tracking-[0.25em] mt-1'>{item.location}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>

                    {/* Next */}
                    <button
                        type='button'
                        onClick={() => sliderRef.current?.slickNext()}
                        className='absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center border border-[#C9A24B]/40 bg-black/60 text-[#C9A24B] hover:bg-[#C9A24B]/15 hover:border-[#C9A24B] hover:text-[#F0D77C] transition-all duration-300 cursor-pointer'
                        aria-label='Next'
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

            </div>

            <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>
        </section>
    )
}

export default Testimonial
