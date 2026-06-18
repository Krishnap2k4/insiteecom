'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * Brand splash preloader for the storefront.
 *
 * Renders by default (so SSR includes it and the user never sees a flash
 * of un-styled content before JS boots). On mount, stays visible briefly,
 * fades out smoothly, and unmounts once the transition completes.
 *
 * Plays on every full page load. SPA navigations within the storefront
 * keep the layout mounted, so the preloader (already unmounted after its
 * first run) does NOT re-trigger between in-app page changes.
 *
 * Brand values (logo / siteName / tagline) come in as props from the
 * server-side storefront layout, so they're SSR-correct and don't flash.
 */
const Preloader = ({ siteName = 'Store', logoUrl = '', tagline = '' }) => {
    const [hide, setHide] = useState(false)
    const [unmount, setUnmount] = useState(false)

    useEffect(() => {
        const fadeT    = setTimeout(() => setHide(true),    1500)
        const unmountT = setTimeout(() => setUnmount(true), 2100)
        return () => { clearTimeout(fadeT); clearTimeout(unmountT) }
    }, [])

    if (unmount) return null

    return (
        <div
            role='status'
            aria-busy={!hide}
            aria-hidden={hide}
            // Inline styles are applied by the HTML parser BEFORE external CSS
            // loads — that's what prevents the white-flash on a hard reload.
            // Tailwind classes layer on top for the visual polish (glow, sparkles,
            // fade transition) once CSS arrives.
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                backgroundColor: '#070707',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                opacity: hide ? 0 : 1,
                pointerEvents: hide ? 'none' : 'auto',
            }}
            className={`transition-opacity duration-500 ease-out ${hide ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            {/* Ambient glow blobs */}
            <div className='absolute top-1/4 -left-24 w-80 h-80 bg-[#C9A24B]/20 rounded-full blur-3xl animate-glow pointer-events-none' />
            <div className='absolute bottom-1/4 -right-24 w-96 h-96 bg-[#F0D77C]/15 rounded-full blur-3xl animate-glow pointer-events-none' style={{ animationDelay: '2s' }} />

            {/* Faint radial vignette */}
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.10),transparent_70%)] pointer-events-none' />

            {/* Sparkles */}
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[22%] left-[18%] text-xl' style={{ animationDelay: '0s'   }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[30%] right-[20%] text-base' style={{ animationDelay: '1.4s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[28%] left-[24%] text-lg'  style={{ animationDelay: '0.7s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[35%] right-[16%] text-base' style={{ animationDelay: '2.1s' }}>✦</span>

            {/* Centerpiece — inline styles mirror the Tailwind classes so the
                content stays centered even during the pre-CSS first paint. */}
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '28px',
                    padding: '0 1.5rem',
                    maxWidth: '90vw',
                    textAlign: 'center',
                    color: '#F0D77C',
                }}
                className='relative flex flex-col items-center gap-7 px-6 max-w-[90vw]'
            >

                {/* Logo or typographic siteName */}
                {logoUrl ? (
                    <Image
                        src={logoUrl}
                        width={220}
                        height={66}
                        alt={siteName}
                        className='h-16 md:h-20 w-auto max-w-full object-contain animate-hero'
                        unoptimized
                        priority
                    />
                ) : (
                    <div className='font-serif-display gold-shine text-5xl md:text-7xl tracking-widest uppercase select-none text-center animate-hero'>
                        {siteName}
                    </div>
                )}

                {/* Diamond divider */}
                <div className='flex items-center gap-3 text-[#C9A24B] animate-hero' style={{ animationDelay: '0.15s' }}>
                    <span className='h-px w-14 bg-gradient-to-r from-transparent to-[#C9A24B]' />
                    <span className='text-sm'>❖</span>
                    <span className='h-px w-14 bg-gradient-to-l from-transparent to-[#C9A24B]' />
                </div>

                {/* Tagline (only when set) */}
                {tagline && (
                    <div className='text-[#F0D77C]/70 text-[10px] md:text-xs tracking-[0.5em] uppercase text-center animate-hero' style={{ animationDelay: '0.3s' }}>
                        {tagline}
                    </div>
                )}

                {/* Gold spinner ring */}
                <div className='relative w-9 h-9 mt-2 animate-hero' style={{ animationDelay: '0.45s' }}>
                    <span className='absolute inset-0 rounded-full border border-[#C9A24B]/15' />
                    <span className='absolute inset-0 rounded-full border border-transparent border-t-[#F0D77C] border-r-[#C9A24B] animate-spin' style={{ animationDuration: '1s' }} />
                </div>

                <span className='sr-only'>Loading {siteName}…</span>
            </div>
        </div>
    )
}

export default Preloader
