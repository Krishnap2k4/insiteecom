'use client'
import { USER_DASHBOARD, WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import Cart from './Cart'
import WishlistIcon from './WishlistIcon'
import NotificationBell from './NotificationBell'
import { useSelector } from 'react-redux'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import userIcon from '@/public/assets/images/user.png'
import Search from './Search'
import { Search as SearchIcon, User, ShoppingBag, Menu, X } from 'lucide-react'

const Header = () => {
    const auth = useSelector(store => store.authStore.auth)
    const [isMobileMenu, setIsMobileMenu] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-[#070707]/95 backdrop-blur-md' : 'bg-transparent'}`}>
            {/* Marquee Announcement Bar */}
            <div className="w-full bg-gradient-to-r from-[#1a1208] via-[#5a4218] to-[#1a1208] text-[#F0D77C] text-[11px] md:text-xs tracking-[0.25em] uppercase py-2 overflow-hidden border-b border-[#C9A24B]/30">
                <div className="flex whitespace-nowrap animate-marquee gap-16 px-6">
                    <div className="flex gap-16 items-center">
                        <span>✦ Free Shipping on Orders Above ₹999</span>
                        <span>✦ Discover Our New Arrivals</span>
                        <span>✦ Crafted with Premium Oils</span>
                        <span>✦ The Signature of Presence</span>
                    </div>
                    <div className="flex gap-16 items-center">
                        <span>✦ Free Shipping on Orders Above ₹999</span>
                        <span>✦ Discover Our New Arrivals</span>
                        <span>✦ Crafted with Premium Oils</span>
                        <span>✦ The Signature of Presence</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="max-w-[1500px] mx-auto px-4 md:px-8 h-[78px] flex items-center justify-between">
                {/* Left: Mobile menu + Nav links */}
                <div className="flex items-center gap-7 flex-1">
                    <button className="md:hidden text-white cursor-pointer" onClick={() => setIsMobileMenu(true)}>
                        <Menu size={22} />
                    </button>
                    <ul className="hidden md:flex items-center gap-7 text-[12px] tracking-[0.25em] text-white/85">
                        <li>
                            <Link href={WEBSITE_SHOP} className="hover:text-[#E5C76B] transition-colors">
                                SHOP ALL
                            </Link>
                        </li>
                        <li>
                            <Link href={`${WEBSITE_SHOP}?category=men`} className="hover:text-[#E5C76B] transition-colors">
                                MEN
                            </Link>
                        </li>
                        <li>
                            <Link href={`${WEBSITE_SHOP}?category=women`} className="hover:text-[#E5C76B] transition-colors">
                                WOMEN
                            </Link>
                        </li>
                        <li>
                            <Link href={`${WEBSITE_SHOP}?category=unisex`} className="hover:text-[#E5C76B] transition-colors">
                                UNISEX
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Center: ELOIR Logo */}
                <Link href={WEBSITE_HOME} className="absolute left-1/2 -translate-x-1/2">
                    <div className="text-center select-none">
                        <div className="font-serif-display font-semibold gold-shine text-2xl leading-none">
                            EL<span className="relative inline-block">
                                <span>O</span>
                                <span className="absolute -top-[0.55em] left-1/2 -translate-x-1/2 text-[0.4em] gold-shine">❖</span>
                            </span>IR
                        </div>
                    </div>
                </Link>

                {/* Right: Nav links + Icons */}
                <div className="flex items-center gap-5 md:gap-6 text-white/85 flex-1 justify-end">
                    <ul className="hidden md:flex items-center gap-7 text-[12px] tracking-[0.25em]">
                        <li>
                            <Link href="/about-us" className="hover:text-[#E5C76B] transition-colors">
                                OUR STORY
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact-us" className="hover:text-[#E5C76B] transition-colors">
                                CONTACT US
                            </Link>
                        </li>
                    </ul>

                    <button type="button" onClick={() => setShowSearch(!showSearch)} className="hover:text-[#E5C76B] transition-colors cursor-pointer">
                        <SearchIcon size={18} />
                    </button>

                    {!auth
                        ?
                        <Link href={WEBSITE_LOGIN} className="hover:text-[#E5C76B] transition-colors hidden md:block">
                            <User size={18} />
                        </Link>
                        :
                        <Link href={USER_DASHBOARD} className="hidden md:block">
                            <div className="w-8 h-8 rounded-full border-2 border-[#C9A24B] overflow-hidden hover:border-[#F0D77C] transition-colors shadow-md shadow-[#C9A24B]/20">
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={auth?.avatar?.url || userIcon.src} className="object-cover" />
                                </Avatar>
                            </div>
                        </Link>
                    }

                    <Cart />

                    <WishlistIcon />
                    <NotificationBell />
                </div>
            </nav>

            {/* Search Bar */}
            <Search isShow={showSearch} />

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${isMobileMenu ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 transition-opacity ${isMobileMenu ? 'opacity-100' : 'opacity-0'}`}
                     onClick={() => setIsMobileMenu(false)} />
                <div className={`absolute top-0 left-0 w-[300px] h-full bg-[#0a0805] border-r border-[#C9A24B]/30 transition-transform duration-300 ${isMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex justify-between items-center p-5 border-b border-[#C9A24B]/20">
                        <div className="font-serif-display font-semibold gold-shine text-xl leading-none">
                            EL<span className="relative inline-block">
                                <span>O</span>
                                <span className="absolute -top-[0.55em] left-1/2 -translate-x-1/2 text-[0.3em] gold-shine">❖</span>
                            </span>IR
                        </div>
                        <button type="button" onClick={() => setIsMobileMenu(false)} className="text-white/60 hover:text-[#E5C76B] cursor-pointer">
                            <X size={22} />
                        </button>
                    </div>
                    <ul className="p-5 space-y-1">
                        {[
                            { label: 'SHOP ALL', href: WEBSITE_SHOP },
                            { label: 'MEN', href: `${WEBSITE_SHOP}?category=men` },
                            { label: 'WOMEN', href: `${WEBSITE_SHOP}?category=women` },
                            { label: 'UNISEX', href: `${WEBSITE_SHOP}?category=unisex` },
                            { label: 'OUR STORY', href: '/about-us' },
                            { label: 'CONTACT US', href: '/contact-us' },
                        ].map(item => (
                            <li key={item.label}>
                                <Link href={item.href}
                                      className="block py-3 text-[12px] tracking-[0.25em] text-white/70 hover:text-[#F0D77C] border-b border-[#C9A24B]/10 transition-colors"
                                      onClick={() => setIsMobileMenu(false)}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="p-5 mt-4">
                        {!auth ? (
                            <Link href={WEBSITE_LOGIN}
                                  className="btn-gold block text-center uppercase text-[11px] tracking-[0.3em] font-semibold px-6 py-3"
                                  onClick={() => setIsMobileMenu(false)}>
                                Sign In
                            </Link>
                        ) : (
                            <Link href={USER_DASHBOARD}
                                  className="btn-dark-gold block text-center uppercase text-[11px] tracking-[0.3em] font-semibold px-6 py-3"
                                  onClick={() => setIsMobileMenu(false)}>
                                My Account
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header