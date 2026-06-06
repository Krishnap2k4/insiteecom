'use client'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/showToast'
import { USER_ADDRESSES, USER_DASHBOARD, USER_MESSAGES, USER_ORDERS, USER_PROFILE, USER_RETURNS, USER_WISHLIST, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { logout } from '@/store/reducer/authReducer'
import axios from '@/lib/apiClient'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import { useDispatch } from 'react-redux'

const UserPanelNavigation = () => {
    const pathname = usePathname()
    const dispatch = useDispatch()
    const router = useRouter()
    const handleLogout = async () => {
        try {
            const { data: logoutResponse } = await axios.post('/api/auth/logout')
            if (!logoutResponse.success) {
                throw new Error(logoutResponse.message)
            }

            dispatch(logout())
            showToast('success', logoutResponse.message)
            router.push(WEBSITE_LOGIN)
        } catch (error) {
            showToast('error', error.message)
        }
    }
    return (
        <div className='border border-[#C9A24B]/20 bg-[#0a0805] p-4'>
            <ul>
                <li className='mb-1'>
                    <Link href={USER_DASHBOARD} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_DASHBOARD) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Dashboard</Link>
                </li>
                <li className='mb-1'>
                    <Link href={USER_PROFILE} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_PROFILE) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Profile</Link>
                </li>
                <li className='mb-1'>
                    <Link href={USER_ORDERS} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_ORDERS) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Orders</Link>
                </li>
                <li className='mb-1'>
                    <Link href={USER_RETURNS} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_RETURNS) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Returns</Link>
                </li>
                <li className='mb-1'>
                    <Link href={USER_MESSAGES} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_MESSAGES) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Messages</Link>
                </li>
                <li className='mb-1'>
                    <Link href={USER_ADDRESSES} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_ADDRESSES) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Addresses</Link>
                </li>
                <li className='mb-1'>
                    <Link href={USER_WISHLIST} className={`block p-3 text-sm transition-colors ${pathname.startsWith(USER_WISHLIST) ? 'bg-[#C9A24B]/15 text-[#F0D77C] border-l-2 border-[#C9A24B]' : 'text-white/70 hover:text-[#F0D77C] hover:bg-white/5'}`} >Wishlist</Link>
                </li>

                <li className='mt-4 pt-4 border-t border-[#C9A24B]/10'>
                    <button type="button" onClick={handleLogout} className="w-full text-left p-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer">
                        Logout
                    </button>
                </li>

            </ul>
        </div>
    )
}

export default UserPanelNavigation