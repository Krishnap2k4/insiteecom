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
        <div className='border shadow-sm p-4 rounded'>
            <ul>
                <li className='mb-2'>
                    <Link href={USER_DASHBOARD} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_DASHBOARD) ? 'bg-primary text-white' : ''}`} >Dashboard</Link>
                </li>
                <li className='mb-2'>
                    <Link href={USER_PROFILE} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_PROFILE) ? 'bg-primary text-white' : ''}`} >Profile</Link>
                </li>
                <li className='mb-2'>
                    <Link href={USER_ORDERS} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_ORDERS) ? 'bg-primary text-white' : ''}`} >Orders</Link>
                </li>
                <li className='mb-2'>
                    <Link href={USER_RETURNS} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_RETURNS) ? 'bg-primary text-white' : ''}`} >Returns</Link>
                </li>
                <li className='mb-2'>
                    <Link href={USER_MESSAGES} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_MESSAGES) ? 'bg-primary text-white' : ''}`} >Messages</Link>
                </li>
                <li className='mb-2'>
                    <Link href={USER_ADDRESSES} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_ADDRESSES) ? 'bg-primary text-white' : ''}`} >Addresses</Link>
                </li>
                <li className='mb-2'>
                    <Link href={USER_WISHLIST} className={`block p-3 text-sm rounded hover:bg-primary hover:text-white ${pathname.startsWith(USER_WISHLIST) ? 'bg-primary text-white' : ''}`} >Wishlist</Link>
                </li>

                <li className='mb-2'>
                    <Button type="button" onClick={handleLogout} variant="destructive" className="w-full">
                        Logout
                    </Button>
                </li>

            </ul>
        </div>
    )
}

export default UserPanelNavigation