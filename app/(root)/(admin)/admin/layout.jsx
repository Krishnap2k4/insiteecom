import AppSidebar from '@/components/Application/Admin/AppSidebar'
import ThemeProvider from '@/components/Application/Admin/ThemeProvider'
import Topbar from '@/components/Application/Admin/Topbar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getSiteSettings } from '@/lib/settings'
import React from 'react'

/**
 * Browser tab title + favicon for every admin page.
 *
 * Title:   "Admin - {siteName}" (per-page titles take precedence via the template).
 * Favicon: the same admin-uploaded favicon used on the storefront — set
 *          explicitly here (in addition to the root layout) so the
 *          inheritance is obvious and can't be broken accidentally.
 */
export async function generateMetadata() {
    const { branding } = await getSiteSettings()
    const siteName = branding?.siteName || 'Admin'
    const iconUrl  = branding?.faviconUrl || '/favicon.ico'
    return {
        title: {
            default: `Admin - ${siteName}`,
            template: `%s · Admin - ${siteName}`,
        },
        icons: {
            icon:     iconUrl,
            shortcut: iconUrl,
            apple:    iconUrl,
        },
    }
}

const layout = async ({ children }) => {
    const { branding } = await getSiteSettings()
    const siteName = branding?.siteName || 'Admin'

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider>
                <AppSidebar />
                <main className="md:w-[calc(100vw-16rem)] w-full overflow-x-hidden">
                    <div className='pt-[70px] md:px-8 px-5 min-h-[calc(100vh-40px)] pb-10'>
                        <Topbar />
                        {children}
                    </div>

                    <div className='border-t h-[40px] flex justify-center items-center bg-gray-50 dark:bg-background text-sm'>
                        © {new Date().getFullYear()} {siteName}. All Rights Reserved.
                    </div>
                </main>
            </SidebarProvider>
        </ThemeProvider>
    )
}

export default layout
