'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Play, X, ChevronRight } from 'lucide-react'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

/**
 * Resolves a video URL into a playable embed or src.
 *  - YouTube  → iframe embed with autoplay
 *  - Vimeo    → iframe embed with autoplay
 *  - Anything else (Cloudinary, mp4, etc.) → native <video>
 */
function resolveVideo(url) {
    if (!url) return null
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/)
    if (ytMatch) {
        return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` }
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
        return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` }
    }
    return { type: 'video', src: url }
}

const VideoModal = ({ item, onClose }) => {
    const video = resolveVideo(item.videoUrl)
    const product = item.product
    const productUrl = product?.slug && product?.publicId
        ? WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)
        : null

    return (
        <div
            className='fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md'
            onClick={onClose}
        >
            <div
                className='relative w-full max-w-6xl bg-[#0a0805]/95 border border-[#C9A24B]/30 shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className='absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition cursor-pointer'
                >
                    <X size={16} />
                </button>

                {/* Video */}
                <div className='md:w-[58%] bg-black flex-shrink-0'>
                    {video?.type === 'youtube' || video?.type === 'vimeo' ? (
                        <iframe
                            src={video.src}
                            className='w-full aspect-video'
                            allow='autoplay; fullscreen'
                            allowFullScreen
                            title={item.title}
                        />
                    ) : (
                        <video
                            src={video?.src}
                            autoPlay
                            controls
                            playsInline
                            className='w-full aspect-video object-cover'
                        />
                    )}
                </div>

                {/* Info panel */}
                <div className='md:w-[42%] p-6 md:p-8 flex flex-col justify-center gap-4 overflow-y-auto'>
                    <div className='flex items-center gap-3'>
                        <span className='h-px w-8 bg-[#C9A24B]/50'></span>
                        <span className='text-[#F0D77C] text-[10px] tracking-[0.4em] uppercase'>Discover the Range</span>
                    </div>

                    <h3 className='font-serif-display text-3xl text-white leading-tight'>{item.title}</h3>

                    {item.description && (
                        <p className='text-white/65 text-sm leading-relaxed'>{item.description}</p>
                    )}

                    {product && (
                        <div className='border-t border-[#C9A24B]/20 pt-4 mt-2'>
                            <p className='text-[10px] tracking-[0.3em] uppercase text-[#C9A24B]/70 mb-1'>Featured Product</p>
                            <p className='font-serif-display text-xl text-[#F0D77C]'>{product.name}</p>
                            {product.sellingPrice > 0 && (
                                <p className='text-white/60 text-sm mt-1'>
                                    {Number(product.sellingPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </p>
                            )}
                        </div>
                    )}

                    {productUrl && (
                        <Link
                            href={productUrl}
                            onClick={onClose}
                            className='inline-flex items-center gap-2 btn-gold uppercase text-[11px] tracking-[0.3em] font-bold px-6 py-3 mt-2 w-fit'
                        >
                            View Product <ChevronRight size={14} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

const ShopTheLook = () => {
    const { data } = useFetch('/api/shop-the-look')
    const [activeItem, setActiveItem] = useState(null)

    const items = data?.success ? data.data : []

    if (items.length === 0) return null

    return (
        <>
            <section className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-16 left-1/3 text-lg' style={{ animationDelay: '0.5s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-20 right-1/4 text-xl' style={{ animationDelay: '2s' }}>✦</span>

                <div className='relative max-w-7xl mx-auto px-6'>
                    <div className='text-center mb-10'>
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>Discover the Range</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Shop the Look</h2>
                    </div>

                    {/* Portrait video cards — tall 9:16-ish ratio */}
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
                        {items.map((item) => {
                            const thumb = item.thumbnail?.secure_url || imgPlaceholder.src
                            return (
                                <button
                                    key={item._id}
                                    type='button'
                                    onClick={() => setActiveItem(item)}
                                    className='group relative w-full overflow-hidden border border-[#C9A24B]/30 hover:border-[#F0D77C] transition card-glow cursor-pointer focus:outline-none'
                                    style={{ aspectRatio: '9/16' }}
                                >
                                    {/* Corner ornaments */}
                                    <span className='absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>
                                    <span className='absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>
                                    <span className='absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>
                                    <span className='absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>

                                    {/* Thumbnail */}
                                    <img
                                        src={thumb}
                                        alt={item.title}
                                        className='absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                                    />

                                    {/* Gradient overlay */}
                                    <div className='absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent'></div>

                                    {/* Play button */}
                                    <div className='absolute inset-0 flex items-center justify-center'>
                                        <div className='w-14 h-14 rounded-full border-2 border-[#F0D77C]/80 bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#C9A24B]/30 group-hover:border-[#F0D77C] transition-all duration-300 group-hover:scale-110'>
                                            <Play size={22} className='text-[#F0D77C] ml-1 fill-[#F0D77C]' />
                                        </div>
                                    </div>

                                    {/* Bottom label */}
                                    <div className='absolute inset-x-0 bottom-0 p-4 text-center'>
                                        <div className='font-serif-display italic text-[#F0D77C] text-lg md:text-xl drop-shadow'>{item.title}</div>
                                        <div className='mt-2 inline-block bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-bold transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'>
                                            Watch Now
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Video popup modal */}
            {activeItem && <VideoModal item={activeItem} onClose={() => setActiveItem(null)} />}
        </>
    )
}

export default ShopTheLook
