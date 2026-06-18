'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LuChevronRight } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import { adminAppSidebarMenu } from "@/lib/adminSidebarMenu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { useSiteSettings } from "@/hooks/useSiteSettings"


const AppSidebar = () => {
    const { toggleSidebar } = useSidebar()
    const { branding } = useSiteSettings()
    const siteName = branding?.siteName || 'Admin'
    const hasCustomLogo = Boolean(branding?.logoUrl)

    return (
        <Sidebar className="z-50">
            <SidebarHeader className="border-b h-14 p-0">
                <div className="flex justify-between items-center px-4">
                    {hasCustomLogo ? (
                        <Image
                            src={branding.logoUrl}
                            height={50}
                            width={160}
                            alt={siteName}
                            className="h-[40px] w-auto object-contain"
                            unoptimized
                        />
                    ) : (
                        <span className="text-lg font-semibold uppercase tracking-widest">
                            {siteName}
                        </span>
                    )}
                    <Button onClick={toggleSidebar} type="button" size="icon" className="md:hidden">
                        <IoMdClose />
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
                <SidebarMenu>
                    {adminAppSidebarMenu.map((menu, index) => (
                        <Collapsible key={index} className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton asChild className="font-semibold px-2 py-5">
                                        <Link href={menu?.url}>
                                            <menu.icon />
                                            {menu.title}

                                            {menu.submenu && menu.submenu.length > 0 &&
                                                <LuChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            }
                                        </Link>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                {menu.submenu && menu.submenu.length > 0
                                    &&
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {menu.submenu.map((submenuItem, subMenuIndex) => (
                                                <SidebarMenuSubItem key={subMenuIndex}>
                                                    <SidebarMenuSubButton asChild className="px-2 py-5">
                                                        <Link href={submenuItem.url}>
                                                            {submenuItem.title}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                }

                            </SidebarMenuItem>
                        </Collapsible>
                    ))}
                </SidebarMenu>
            </SidebarContent>

        </Sidebar>
    )
}

export default AppSidebar