import Footer from '@/components/Application/Website/Footer'
import Header from '@/components/Application/Website/Header'
import CartHydrator from '@/components/Application/Website/CartHydrator'
import React from 'react'
import { Cormorant_Garamond, Inter } from 'next/font/google'

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

const layout = ({ children }) => {
    return (
        <div className={`${cormorant.variable} ${inter.variable} font-sans bg-[#070707] text-white min-h-screen`}
             style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
            <CartHydrator />
            <Header />
            <main>
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default layout