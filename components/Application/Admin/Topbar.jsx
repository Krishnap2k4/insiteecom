'use client'
import React from 'react'
import ThemeSwitch from './ThemeSwitch'
import UserDropdown from './UserDropdown'
import { Button } from '@/components/ui/button'
import { RiMenu4Fill } from "react-icons/ri";
import { useSidebar } from '@/components/ui/sidebar';
import AdminSearch from './AdminSearch'
import Image from 'next/image'
import AdminMobileSearch from './AdminMobileSearch'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const Topbar = () => {
    const { toggleSidebar } = useSidebar()
    const { branding } = useSiteSettings()
    const siteName = branding?.siteName || 'Admin'
    const hasCustomLogo = Boolean(branding?.logoUrl)

    return (
        <div className='fixed border h-14 w-full top-0 left-0 z-30 md:ps-72 md:pe-8 px-5 flex justify-between items-center bg-white dark:bg-card'>

            <div className='flex items-center md:hidden'>
                {hasCustomLogo ? (
                    <Image
                        src={branding.logoUrl}
                        height={50}
                        width={140}
                        alt={siteName}
                        className="h-[40px] w-auto object-contain"
                        unoptimized
                    />
                ) : (
                    <span className='text-base font-semibold uppercase tracking-widest'>{siteName}</span>
                )}
            </div>
            <div className='md:block hidden'>
                <AdminSearch />
            </div>


            <div className='flex items-center gap-2'>
                <AdminMobileSearch />
                <ThemeSwitch />
                <UserDropdown />
                <Button onClick={toggleSidebar} type="button" size="icon" className="ms-2 md:hidden">
                    <RiMenu4Fill />
                </Button>
            </div>

        </div>
    )
}

export default Topbar