'use client'
import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Storefront segment error boundary — catches errors in any page under
 * the (website) group while preserving the surrounding chrome (header,
 * footer, marquee). Auto-recovers from ChunkLoadError on first hit.
 */
const isChunkLoadError = (error) => {
    if (!error) return false
    const msg = error.message || ''
    return (
        error.name === 'ChunkLoadError' ||
        /Loading (chunk|CSS chunk) \d+ failed/i.test(msg) ||
        /failed to fetch dynamically imported module/i.test(msg)
    )
}

export default function StorefrontError({ error, reset }) {
    useEffect(() => {
        // Log the real error to the browser console so it's visible in
        // production user reports / DevTools, not swallowed by the boundary.
        // (Next.js already reports it to the server via instrumentation
        // when configured; this surfaces it for the visitor too.)
        if (error) console.error('[Storefront error boundary]', error)

        if (isChunkLoadError(error)) {
            try {
                if (sessionStorage.getItem('chunk-reloaded') !== '1') {
                    sessionStorage.setItem('chunk-reloaded', '1')
                    window.location.reload()
                }
            } catch { /* ignore */ }
        }
    }, [error])

    return (
        <section className='min-h-[70vh] flex items-center justify-center px-5 py-24'>
            <div className='max-w-md w-full text-center'>
                <div className='text-[11px] tracking-[0.4em] uppercase text-[#C9A24B] mb-4'>
                    Something went wrong
                </div>
                <h1 className='font-serif-display gold-shine text-4xl md:text-5xl mb-3'>
                    We hit a snag
                </h1>
                <p className='text-white/65 leading-relaxed text-sm mb-8'>
                    The page couldn't load. Please try again — if it keeps happening,
                    go back home or check your connection.
                </p>
                <div className='flex items-center justify-center gap-3 flex-wrap'>
                    <button
                        type='button'
                        onClick={() => reset()}
                        className='btn-gold uppercase text-[11px] tracking-[0.25em] font-bold px-7 py-3 cursor-pointer'
                    >
                        Try again
                    </button>
                    <Link
                        href='/'
                        className='btn-dark-gold uppercase text-[11px] tracking-[0.25em] font-semibold px-7 py-3'
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </section>
    )
}
