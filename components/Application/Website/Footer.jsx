import React from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Twitter } from 'lucide-react'
import { USER_DASHBOARD, WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_REGISTER, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

const Footer = () => {
    return (
        <footer className='relative bg-gradient-to-b from-[#0a0805] to-[#040404] border-t border-[#C9A24B]/30 pt-16 pb-10 overflow-hidden'>
            {/* Top glow line */}
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F0D77C] to-transparent'></div>
            <div className='absolute top-0 left-1/4 w-64 h-64 bg-[#C9A24B]/10 rounded-full blur-3xl'></div>

            <div className='relative max-w-7xl mx-auto px-6'>
                <div className='grid md:grid-cols-4 gap-10'>
                    {/* Brand Column */}
                    <div>
                        <div className='text-center md:text-left select-none'>
                            <div className='font-serif-display font-semibold gold-shine text-4xl md:text-5xl leading-none'>
                                EL<span className='relative inline-block'>
                                    <span>O</span>
                                    <span className='absolute -top-[0.55em] left-1/2 -translate-x-1/2 text-[0.4em] gold-shine'>❖</span>
                                </span>IR
                            </div>
                            <div className='flex items-center justify-center md:justify-start gap-2 mt-1'>
                                <span className='text-[#C9A24B]'>◆</span>
                                <div className='uppercase text-white/80 text-[10px] md:text-[11px] tracking-[0.4em]'>
                                    The Signature of Presence
                                </div>
                                <span className='text-[#C9A24B]'>◆</span>
                            </div>
                        </div>
                        <p className='text-white/55 text-sm mt-6 leading-relaxed'>
                            ELOIR crafts premium extrait de parfum for the modern connoisseur — each bottle a signature of presence.
                        </p>

                        {/* Social Icons */}
                        <div className='flex gap-3 mt-5'>
                            <Link href="#" className='w-9 h-9 rounded-full border border-[#C9A24B]/50 flex items-center justify-center text-[#F0D77C] hover:bg-gradient-to-br hover:from-[#C9A24B] hover:to-[#F0D77C] hover:text-[#1a1208] transition'>
                                <Instagram size={16} />
                            </Link>
                            <Link href="#" className='w-9 h-9 rounded-full border border-[#C9A24B]/50 flex items-center justify-center text-[#F0D77C] hover:bg-gradient-to-br hover:from-[#C9A24B] hover:to-[#F0D77C] hover:text-[#1a1208] transition'>
                                <Facebook size={16} />
                            </Link>
                            <Link href="#" className='w-9 h-9 rounded-full border border-[#C9A24B]/50 flex items-center justify-center text-[#F0D77C] hover:bg-gradient-to-br hover:from-[#C9A24B] hover:to-[#F0D77C] hover:text-[#1a1208] transition'>
                                <Twitter size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Shop Column */}
                    <div>
                        <div className='text-[#F0D77C] uppercase tracking-[0.3em] text-[11px] font-semibold flex items-center gap-2'>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Shop
                        </div>
                        <ul className='mt-4 space-y-2 text-white/60 text-sm'>
                            <li><Link href={WEBSITE_SHOP} className='hover:text-[#F0D77C] transition'>All Fragrances</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?category=men`} className='hover:text-[#F0D77C] transition'>For Him</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?category=women`} className='hover:text-[#F0D77C] transition'>For Her</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?category=unisex`} className='hover:text-[#F0D77C] transition'>Unisex</Link></li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <div className='text-[#F0D77C] uppercase tracking-[0.3em] text-[11px] font-semibold flex items-center gap-2'>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Support
                        </div>
                        <ul className='mt-4 space-y-2 text-white/60 text-sm'>
                            <li><Link href="/contact-us" className='hover:text-[#F0D77C] transition'>Contact Us</Link></li>
                            <li><Link href="/orders" className='hover:text-[#F0D77C] transition'>Track Order</Link></li>
                            <li><Link href="/returns" className='hover:text-[#F0D77C] transition'>Returns</Link></li>
                            <li><Link href={WEBSITE_LOGIN} className='hover:text-[#F0D77C] transition'>Login</Link></li>
                            <li><Link href={WEBSITE_REGISTER} className='hover:text-[#F0D77C] transition'>Register</Link></li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <div className='text-[#F0D77C] uppercase tracking-[0.3em] text-[11px] font-semibold flex items-center gap-2'>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Company
                        </div>
                        <ul className='mt-4 space-y-2 text-white/60 text-sm'>
                            <li><Link href="/about-us" className='hover:text-[#F0D77C] transition'>Our Story</Link></li>
                            <li><Link href={USER_DASHBOARD} className='hover:text-[#F0D77C] transition'>My Account</Link></li>
                            <li><Link href="/privacy-policy" className='hover:text-[#F0D77C] transition'>Privacy</Link></li>
                            <li><Link href="/terms-and-conditions" className='hover:text-[#F0D77C] transition'>Terms</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Gold divider */}
                <div className='gold-line h-px my-10'></div>

                {/* Bottom bar */}
                <div className='flex flex-col md:flex-row justify-between items-center text-white/40 text-xs gap-3'>
                    <div>© {new Date().getFullYear()} ELOIR · The Signature of Presence. All rights reserved.</div>
                    <div className='flex gap-5'>
                        <Link href="/terms-and-conditions" className='hover:text-[#F0D77C]'>Terms</Link>
                        <Link href="/privacy-policy" className='hover:text-[#F0D77C]'>Privacy</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer