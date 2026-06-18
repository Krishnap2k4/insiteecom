import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WEBSITE_HOME } from '@/routes/WebsiteRoute'

/**
 * Shared chrome for every auth page (login, register, reset-password,
 * verify-email). Adds a single subtle "Back to home" affordance in the
 * top-left so users can always escape the auth flow — placed in the
 * layout once so every auth screen gets it consistently without each
 * page having to repeat the markup.
 */
const layout = ({ children }) => {
    return (
        <div className='storefront min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] relative overflow-hidden'>
            <div className='absolute top-1/4 -left-20 w-80 h-80 bg-[#C9A24B]/25 rounded-full blur-3xl animate-glow'></div>
            <div className='absolute bottom-1/4 -right-20 w-96 h-96 bg-[#F0D77C]/15 rounded-full blur-3xl animate-glow' style={{ animationDelay: '2s' }}></div>

            {/* Back to home — fixed so it stays put while users scroll
                long auth cards on mobile. text-only on small screens,
                pill with label on sm+. */}
            <Link
                href={WEBSITE_HOME}
                aria-label='Back to home'
                className='group fixed top-5 left-5 sm:top-6 sm:left-6 z-20 inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-[11px] tracking-[0.25em] uppercase text-white/70 hover:text-[#F0D77C] border border-[#C9A24B]/35 hover:border-[#C9A24B] bg-black/30 hover:bg-[#C9A24B]/10 backdrop-blur-sm transition-all duration-300'
            >
                <ArrowLeft size={14} className='transition-transform duration-300 group-hover:-translate-x-0.5' />
                <span className='hidden sm:inline'>Back to home</span>
            </Link>

            <div className='relative z-10 w-full flex justify-center items-center px-4'>
                {children}
            </div>
        </div>
    )
}

export default layout
