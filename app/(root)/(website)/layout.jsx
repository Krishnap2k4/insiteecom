/**
 * ISR window for the storefront. Every page rendered under this
 * layout (home, shop, product, category, etc.) is cached and
 * regenerated at most every 60s — which means:
 *
 *   • Hot pages serve from the cache (fast, CDN-friendly).
 *   • An admin save calls `revalidatePath('/', 'layout')` which
 *     invalidates the whole storefront tree instantly — visitors
 *     see the change on their very next request, no 60s wait.
 *   • The 60s window is a safety net: if a revalidate call ever
 *     gets missed, the staleness is bounded.
 *
 * This is the canonical Next.js ISR pattern — no `force-dynamic`,
 * no `unstable_*` APIs, just stable Segment Config.
 */
export const revalidate = 60

import Footer from '@/components/Application/Website/Footer'
import Header from '@/components/Application/Website/Header'
import CartHydrator from '@/components/Application/Website/CartHydrator'
import CartBar from '@/components/Application/Website/CartBar'
import Preloader from '@/components/Application/Website/Preloader'
import React from 'react'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { getSiteSettings } from '@/lib/settings'

const cormorant = Cormorant_Garamond({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-cormorant',
    display: 'swap'
})

const inter = Inter({
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap'
})

const layout = async ({ children }) => {
    // Brand values are SSR'd so the splash never flashes from a fallback
    // siteName to the real one on hydration.
    const { branding } = await getSiteSettings()

    return (
        <div className={`storefront ${cormorant.variable} ${inter.variable} font-sans bg-[#070707] text-white min-h-screen`}
             style={{
                 // Inline backgroundColor + minHeight mirror the Tailwind classes
                 // so the dark canvas is in effect during the brief first-paint
                 // window before stylesheets load — prevents any white flash
                 // around the preloader on a hard reload.
                 backgroundColor: '#070707',
                 minHeight: '100vh',
                 color: 'white',
                 fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
             }}>
            <Preloader
                siteName={branding.siteName}
                logoUrl={branding.logoUrl}
                tagline={branding.tagline}
            />
            <CartHydrator />
            <Header />
            <main>
                {children}
            </main>
            <Footer />
            <CartBar />
        </div>
    )
}

export default layout
