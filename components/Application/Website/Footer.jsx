import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Twitter } from 'lucide-react'
import { USER_DASHBOARD, WEBSITE_LOGIN, WEBSITE_REGISTER, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { getSiteSettings } from '@/lib/settings'

const COLUMN_HEADING = 'text-[#F0D77C] uppercase tracking-[0.3em] text-[11px] font-semibold flex items-center gap-2'
const LINK_CLASS = 'hover:text-[#F0D77C] transition-colors'

const SOCIAL_ICON_CLASS = 'w-9 h-9 rounded-full border border-[#C9A24B]/50 flex items-center justify-center text-[#F0D77C] hover:bg-gradient-to-br hover:from-[#C9A24B] hover:to-[#F0D77C] hover:text-[#1a1208] transition'

const Footer = async () => {
    const settings = await getSiteSettings()
    const { branding, social } = settings
    const footerLogo = branding.logoFooterUrl || branding.logoUrl
    const siteName   = branding.siteName || 'Store'

    return (
        <footer className='relative bg-gradient-to-b from-[#0a0805] to-[#040404] border-t border-[#C9A24B]/30 pt-16 pb-10 overflow-hidden'>
            {/* Top glow line */}
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F0D77C] to-transparent'></div>
            <div className='absolute top-0 left-1/4 w-64 h-64 bg-[#C9A24B]/10 rounded-full blur-3xl'></div>

            <div className='relative max-w-7xl mx-auto px-6'>

                {/* ── Main grid ── */}
                <div className='grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-10'>

                    {/* Brand */}
                    <div className='col-span-2 lg:col-span-1'>
                        <div className='select-none'>
                            {footerLogo ? (
                                <Image src={footerLogo} width={160} height={48} alt={siteName} className='h-12 w-auto object-contain' unoptimized />
                            ) : (
                                <div className='font-serif-display font-semibold gold-shine text-4xl leading-none uppercase tracking-widest'>
                                    {siteName}
                                </div>
                            )}
                        </div>
                        {branding.description && (
                            <p className='text-white/55 text-sm mt-5 leading-relaxed'>
                                {branding.description}
                            </p>
                        )}

                        {/* Social icons — render only if URL is set */}
                        <div className='flex gap-3 mt-5'>
                            {social.instagram && (
                                <Link href={social.instagram} target='_blank' rel='noopener noreferrer' aria-label='Instagram' className={SOCIAL_ICON_CLASS}>
                                    <Instagram size={16} />
                                </Link>
                            )}
                            {social.facebook && (
                                <Link href={social.facebook} target='_blank' rel='noopener noreferrer' aria-label='Facebook' className={SOCIAL_ICON_CLASS}>
                                    <Facebook size={16} />
                                </Link>
                            )}
                            {social.twitter && (
                                <Link href={social.twitter} target='_blank' rel='noopener noreferrer' aria-label='Twitter / X' className={SOCIAL_ICON_CLASS}>
                                    <Twitter size={16} />
                                </Link>
                            )}
                        </div>

                        {/* Quick contact */}
                        <div className='mt-5 space-y-1 text-white/50 text-xs'>
                            {social.email && (
                                <p>
                                    <a href={`mailto:${social.email}`} className='hover:text-[#F0D77C] transition-colors'>
                                        {social.email}
                                    </a>
                                </p>
                            )}
                            {social.whatsapp && (
                                <p>
                                    <a href={`https://wa.me/${social.whatsapp}`} target='_blank' rel='noopener noreferrer' className='hover:text-[#F0D77C] transition-colors'>
                                        {social.phone || `+${social.whatsapp}`}
                                    </a>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <div className={COLUMN_HEADING}>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Shop
                        </div>
                        <ul className='mt-4 space-y-2.5 text-white/60 text-sm'>
                            <li><Link href={WEBSITE_SHOP} className={LINK_CLASS}>All Fragrances</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?category=men`} className={LINK_CLASS}>For Him</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?category=women`} className={LINK_CLASS}>For Her</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?category=unisex`} className={LINK_CLASS}>Unisex</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?sort=default_sorting`} className={LINK_CLASS}>New Arrivals</Link></li>
                            <li><Link href={`${WEBSITE_SHOP}?sort=bestseller`} className={LINK_CLASS}>Bestsellers</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <div className={COLUMN_HEADING}>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Help
                        </div>
                        <ul className='mt-4 space-y-2.5 text-white/60 text-sm'>
                            <li><Link href="/contact-us" className={LINK_CLASS}>Contact Us</Link></li>
                            <li><Link href="/contact-us#faq" className={LINK_CLASS}>FAQs</Link></li>
                            <li><Link href="/orders" className={LINK_CLASS}>Track Order</Link></li>
                            <li><Link href="/returns" className={LINK_CLASS}>My Returns</Link></li>
                            <li><Link href={WEBSITE_LOGIN} className={LINK_CLASS}>Login</Link></li>
                            <li><Link href={WEBSITE_REGISTER} className={LINK_CLASS}>Register</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <div className={COLUMN_HEADING}>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Company
                        </div>
                        <ul className='mt-4 space-y-2.5 text-white/60 text-sm'>
                            <li><Link href="/about-us" className={LINK_CLASS}>Our Story</Link></li>
                            <li><Link href="/contact-us" className={LINK_CLASS}>Contact</Link></li>
                            <li><Link href={USER_DASHBOARD} className={LINK_CLASS}>My Account</Link></li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <div className={COLUMN_HEADING}>
                            <span className='h-px w-6 bg-[#C9A24B]'></span> Policies
                        </div>
                        <ul className='mt-4 space-y-2.5 text-white/60 text-sm'>
                            <li><Link href="/privacy-policy" className={LINK_CLASS}>Privacy Policy</Link></li>
                            <li><Link href="/terms-and-conditions" className={LINK_CLASS}>Terms &amp; Conditions</Link></li>
                            <li><Link href="/refund-policy" className={LINK_CLASS}>Refund &amp; Return Policy</Link></li>
                            <li><Link href="/cancellation-policy" className={LINK_CLASS}>Cancellation Policy</Link></li>
                            <li><Link href="/shipping-policy" className={LINK_CLASS}>Shipping Policy</Link></li>
                        </ul>
                    </div>

                </div>

                {/* Gold divider */}
                <div className='h-px bg-gradient-to-r from-transparent via-[#C9A24B]/50 to-transparent my-10'></div>

                {/* Bottom bar */}
                <div className='flex flex-col md:flex-row justify-between items-center text-white/40 text-xs gap-3'>
                    <div>© {new Date().getFullYear()} {siteName}{branding.tagline ? ` · ${branding.tagline}` : ''}. All rights reserved.</div>
                    <div className='flex flex-wrap justify-center gap-4'>
                        <Link href="/privacy-policy" className='hover:text-[#F0D77C] transition-colors'>Privacy</Link>
                        <Link href="/terms-and-conditions" className='hover:text-[#F0D77C] transition-colors'>Terms</Link>
                        <Link href="/refund-policy" className='hover:text-[#F0D77C] transition-colors'>Refunds</Link>
                        <Link href="/cancellation-policy" className='hover:text-[#F0D77C] transition-colors'>Cancellations</Link>
                        <Link href="/shipping-policy" className='hover:text-[#F0D77C] transition-colors'>Shipping</Link>
                    </div>
                </div>

            </div>
        </footer>
    )
}

export default Footer
