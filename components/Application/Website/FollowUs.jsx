'use client'
import Link from 'next/link'
import { useRef } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import AnimateIn from './AnimateIn'
import { Instagram, Facebook, ChevronLeft, ChevronRight } from 'lucide-react'

// Replace src values with actual Instagram post images when available
const IMAGES = [
    { src: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR signature' },
    { src: 'https://images.unsplash.com/photo-1622618991746-fe6004db3a47?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR for her' },
    { src: 'https://images.unsplash.com/photo-1544006593-1a0b9255782d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR maison' },
    { src: 'https://images.unsplash.com/photo-1541643600914-78b084683702?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Luxury collection' },
    { src: 'https://images.unsplash.com/photo-1547994770-a624c7f5ea0f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR atelier' },
    { src: 'https://images.unsplash.com/photo-1592945403407-9caf930dccb5?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Fragrance lifestyle' },
    { src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR moments' },
    { src: 'https://images.unsplash.com/photo-1586495777744-4e6b3a5d7ef9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'Premium fragrance' },
    { src: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR luxury' },
    { src: 'https://images.unsplash.com/photo-1588776814546-1ffb2c6649b7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600', alt: 'ELOIR collection' },
]

const SOCIALS = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Facebook, label: 'Facebook', href: '#' },
]

const SLIDER_SETTINGS = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 800,
    slidesToShow: 4,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 2800,
    pauseOnHover: true,
    responsive: [
        { breakpoint: 1280, settings: { slidesToShow: 4, slidesToScroll: 2 } },
        { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 2 } },
        { breakpoint: 640,  settings: { slidesToShow: 2, slidesToScroll: 2 } },
        { breakpoint: 480,  settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
}

const FollowUs = () => {
    const sliderRef = useRef(null)

    return (
        <section className='relative bg-[#07060a] py-20 md:py-28 overflow-hidden'>
            {/* Hairline borders */}
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent pointer-events-none'></div>
            <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent pointer-events-none'></div>

            {/* Ambient glow */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A24B]/6 rounded-full blur-3xl pointer-events-none'></div>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-12 left-[20%] text-xl' style={{ animationDelay: '0.4s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-12 right-[20%] text-base' style={{ animationDelay: '1.8s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-12 left-[35%] text-lg' style={{ animationDelay: '3.1s' }}>✦</span>

            <div className='relative max-w-7xl mx-auto px-6'>

                {/* Section Header */}
                <AnimateIn direction="fade" className="text-center mb-12">
                    <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        <span className='text-xs'>❖</span>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                    </div>
                    <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>Join the Conversation</div>
                    <h2 className='font-serif-display gold-shine text-5xl md:text-6xl mt-3'>
                        Follow Our World
                    </h2>
                    <p className='text-white/45 mt-3 text-[13px] tracking-[0.3em] font-light'>
                        @eloirfragrances
                    </p>

                    {/* Social buttons */}
                    <div className='flex items-center justify-center gap-3 mt-7'>
                        {SOCIALS.map(({ icon: Icon, label, href }) => (
                            <Link
                                key={label}
                                href={href}
                                className='group inline-flex items-center gap-2.5 border border-[#C9A24B]/35 hover:border-[#C9A24B] hover:bg-[#C9A24B]/10 text-white/55 hover:text-[#F0D77C] px-6 py-3 text-[11px] tracking-[0.3em] uppercase transition-all duration-300'
                            >
                                <Icon size={14} className='transition-transform duration-300 group-hover:scale-110' />
                                {label}
                            </Link>
                        ))}
                    </div>
                </AnimateIn>

            </div>

            {/* ── Full-width carousel ── */}
            <AnimateIn direction="fade" threshold={0.05}>
                <div className='relative mt-12'>

                    {/* Prev arrow */}
                    <button
                        type='button'
                        onClick={() => sliderRef.current?.slickPrev()}
                        className='absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center border border-[#C9A24B]/40 bg-black/70 text-[#C9A24B] hover:bg-[#C9A24B]/15 hover:border-[#C9A24B] hover:text-[#F0D77C] transition-all duration-300 cursor-pointer'
                        aria-label='Previous'
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {/* Slider — no outer padding, goes edge to edge */}
                    <Slider ref={sliderRef} {...SLIDER_SETTINGS}>
                        {IMAGES.map((img, i) => (
                            <div key={i} className='px-0.5'>
                                <Link href='#' className='block relative aspect-square overflow-hidden group/img'>
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        className='w-full h-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-110'
                                    />
                                    <div className='absolute inset-0 bg-[#1a1208]/0 group-hover/img:bg-[#1a1208]/60 flex items-center justify-center transition-all duration-300'>
                                        <div className='flex flex-col items-center gap-2 opacity-0 group-hover/img:opacity-100 transition-all duration-300 translate-y-2 group-hover/img:translate-y-0'>
                                            <Instagram size={22} className='text-[#F0D77C]' />
                                            <span className='text-[#F0D77C]/80 text-[9px] tracking-[0.3em] uppercase'>#ELOIR</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </Slider>

                    {/* Next arrow */}
                    <button
                        type='button'
                        onClick={() => sliderRef.current?.slickNext()}
                        className='absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center border border-[#C9A24B]/40 bg-black/70 text-[#C9A24B] hover:bg-[#C9A24B]/15 hover:border-[#C9A24B] hover:text-[#F0D77C] transition-all duration-300 cursor-pointer'
                        aria-label='Next'
                    >
                        <ChevronRight size={18} />
                    </button>

                </div>
            </AnimateIn>

        </section>
    )
}

export default FollowUs
