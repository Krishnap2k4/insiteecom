'use client'
import Image from 'next/image'
import Link from 'next/link'
import { WEBSITE_HOME } from '@/routes/WebsiteRoute'
import { useSiteSettings } from '@/hooks/useSiteSettings'

/**
 * Shared brand header for every auth-flow page (login, register,
 * reset-password, verify-email).
 *
 * Reads from the CMS via useSiteSettings so a single brand update in
 * the admin panel propagates everywhere. Uses the admin-uploaded logo
 * when set; falls back to the typographic siteName in the same
 * gold-shine treatment as the rest of the storefront chrome.
 */
const AuthBrand = ({ className = '' }) => {
    const { branding } = useSiteSettings()
    const siteName = branding?.siteName || 'Store'

    return (
        <div className={`flex justify-center mb-6 ${className}`}>
            <Link href={WEBSITE_HOME} aria-label={siteName} className='inline-block'>
                {branding?.logoUrl ? (
                    <Image
                        src={branding.logoUrl}
                        alt={siteName}
                        width={180}
                        height={60}
                        className='h-12 w-auto object-contain'
                        unoptimized
                        priority
                    />
                ) : (
                    <div className='font-serif-display gold-shine text-4xl tracking-widest uppercase'>
                        {siteName}
                    </div>
                )}
            </Link>
        </div>
    )
}

export default AuthBrand
