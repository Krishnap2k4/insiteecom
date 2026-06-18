'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'

/**
 * Admin error boundary. Same auto-reload-on-chunk-load-failure as the
 * storefront, with admin-themed styling so the chrome stays consistent.
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

export default function AdminError({ error, reset }) {
    useEffect(() => {
        if (error) console.error('[Admin error boundary]', error)
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
        <div className='min-h-[60vh] flex items-center justify-center px-5 py-12'>
            <div className='max-w-md w-full text-center'>
                <h1 className='text-2xl font-semibold mb-3'>Something went wrong</h1>
                <p className='text-sm text-muted-foreground mb-6 leading-relaxed'>
                    The page couldn't load. Try again, or head back to the dashboard.
                    If this keeps happening, check the server logs.
                </p>
                <div className='flex items-center justify-center gap-3 flex-wrap'>
                    <button
                        type='button'
                        onClick={() => reset()}
                        className='inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition px-6 py-2.5 text-sm font-medium rounded-md cursor-pointer'
                    >
                        Try again
                    </button>
                    <Link
                        href={ADMIN_DASHBOARD}
                        className='inline-flex items-center justify-center border border-input bg-background hover:bg-accent hover:text-accent-foreground transition px-6 py-2.5 text-sm font-medium rounded-md'
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
