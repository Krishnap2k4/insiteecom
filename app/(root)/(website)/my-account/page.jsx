'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch';
import useRequireAuth from '@/hooks/useRequireAuth'
import { WEBSITE_ORDER_DETAILS } from '@/routes/WebsiteRoute';
import Link from 'next/link';
import React from 'react'
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { IoCartOutline } from "react-icons/io5";
import { useSelector } from 'react-redux';

const breadCrumbData = {
    title: 'Dashboard',
    links: [{ label: 'Dashboard' }]
}
const MyAccount = () => {
    const { isLoggedIn, rehydrated } = useRequireAuth()
    const { data: dashboardData } = useFetch('/api/dashboard/user')
    const cartStore = useSelector(store => store.cartStore)
    if (!rehydrated || !isLoggedIn) return null

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className='border border-[#C9A24B]/20 bg-[#0a0805]'>
                    <div className='p-5 text-xl font-serif-display text-[#F0D77C] border-b border-[#C9A24B]/20'>
                        Dashboard
                    </div>
                    <div className='p-5'>
                        <div className='grid lg:grid-cols-2 grid-cols-1 gap-10'>
                            <div className='flex items-center justify-between gap-5 border border-[#C9A24B]/20 p-4'>
                                <div>
                                    <h4 className='font-semibold text-lg mb-1 text-white/90'>Total Orders</h4>
                                    <span className='font-semibold text-[#F0D77C] text-2xl'>{dashboardData?.data?.totalOrder || 0}</span>
                                </div>
                                <div className='w-16 h-16 bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex justify-center items-center'>
                                    <HiOutlineShoppingBag className='text-[#0a0805]' size={25} />
                                </div>
                            </div>
                            <div className='flex items-center justify-between gap-5 border border-[#C9A24B]/20 p-4'>
                                <div>
                                    <h4 className='font-semibold text-lg mb-1 text-white/90'>Items In Cart</h4>
                                    <span className='font-semibold text-[#F0D77C] text-2xl'>{cartStore?.count}</span>
                                </div>
                                <div className='w-16 h-16 bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex justify-center items-center'>
                                    <IoCartOutline className='text-[#0a0805]' size={25} />
                                </div>
                            </div>
                        </div>

                        <div className='mt-8'>
                            <h4 className='text-lg font-serif-display text-[#F0D77C] mb-4'>Recent Orders</h4>
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr>
                                            <th className='text-start p-2 text-[11px] tracking-[0.2em] uppercase border-b border-[#C9A24B]/20 text-white/50'>Sr.No.</th>
                                            <th className='text-start p-2 text-[11px] tracking-[0.2em] uppercase border-b border-[#C9A24B]/20 text-white/50'>Order id</th>
                                            <th className='text-start p-2 text-[11px] tracking-[0.2em] uppercase border-b border-[#C9A24B]/20 text-white/50'>Total Item</th>
                                            <th className='text-start p-2 text-[11px] tracking-[0.2em] uppercase border-b border-[#C9A24B]/20 text-white/50'>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData && dashboardData?.data?.recentOrders?.map((order, i) => (
                                            <tr key={order._id} className='hover:bg-white/5 transition-colors'>
                                                <td className='text-start text-sm text-white/50 p-2 font-bold'>{i + 1}</td>
                                                <td className='text-start text-sm p-2'>
                                                    <Link className='text-[#C9A24B] hover:text-[#F0D77C] underline underline-offset-2 transition-colors' href={WEBSITE_ORDER_DETAILS(order.orderNumber)}>{order.orderNumber}</Link>
                                                </td>
                                                <td className='text-start text-sm text-white/50 p-2 '>{order.itemCount}</td>
                                                <td className='text-start text-sm text-white/50 p-2 '>
                                                    {Number(order.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: order.currency || 'INR' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </div>
                        </div>

                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default MyAccount