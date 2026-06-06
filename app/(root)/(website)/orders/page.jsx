'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_INVOICE_DOWNLOAD, WEBSITE_ORDER_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { FiDownload } from 'react-icons/fi'

const breadCrumbData = { title: 'Orders', links: [{ label: 'Orders' }] }

const paymentChip = (status) => {
    const map = {
        paid: 'bg-emerald-500/20 text-emerald-400',
        pending: 'bg-amber-500/20 text-amber-400',
        failed: 'bg-red-500/20 text-red-400',
        refunded: 'bg-white/10 text-white/60',
        partially_refunded: 'bg-white/10 text-white/60',
    }
    return (
        <span className={`text-xs px-2 py-0.5 capitalize ${map[status] || 'bg-white/10 text-white/50'}`}>
            {String(status || '').replace('_', ' ')}
        </span>
    )
}
const fulfillmentChip = (status) => {
    const map = {
        fulfilled: 'bg-emerald-500/20 text-emerald-400',
        partial: 'bg-sky-500/20 text-sky-400',
        unfulfilled: 'bg-amber-500/20 text-amber-400',
        cancelled: 'bg-red-500/20 text-red-400',
    }
    return (
        <span className={`text-xs px-2 py-0.5 capitalize ${map[status] || 'bg-white/10 text-white/50'}`}>
            {String(status || '').replace('_', ' ')}
        </span>
    )
}

const Orders = () => {
    const { data: orderData, loading } = useFetch('/api/user-order')
    const list = orderData?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className='border border-[#C9A24B]/20 bg-[#0a0805]'>
                    <div className='p-5 text-xl font-serif-display border-b border-[#C9A24B]/20 flex items-center justify-between'>
                        <span className='text-[#F0D77C]'>Orders</span>
                        <Link href={WEBSITE_SHOP} className='text-sm font-normal text-[#C9A24B] hover:text-[#F0D77C] transition-colors'>Continue Shopping</Link>
                    </div>

                    <div className='p-5'>
                        {loading ? (
                            <div className='text-center py-10 text-white/50'>Loading…</div>
                        ) : list.length === 0 ? (
                            <div className='text-center py-10 text-white/40'>
                                You haven&apos;t placed any orders yet.
                            </div>
                        ) : (
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='text-left text-[11px] uppercase tracking-[0.2em] text-white/50'>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Order #</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Placed</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Items</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Amount</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Payment</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Delivery</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.map((order) => (
                                            <tr key={order._id} className='hover:bg-white/5 transition-colors border-b border-[#C9A24B]/10'>
                                                <td className='p-2 text-sm'>
                                                    <Link
                                                        className='font-medium underline-offset-2 hover:underline text-[#C9A24B] hover:text-[#F0D77C] transition-colors'
                                                        href={WEBSITE_ORDER_DETAILS(order.orderNumber)}
                                                    >
                                                        {order.orderNumber}
                                                    </Link>
                                                    {order.hasActiveReturn && (
                                                        <span className='ml-2 inline-flex items-center text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 uppercase tracking-wide'>
                                                            Return active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className='p-2 text-sm text-white/50'>
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </td>
                                                <td className='p-2 text-sm text-white/70'>{order.itemCount}</td>
                                                <td className='p-2 text-sm font-medium text-white'>
                                                    {Number(order.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: order.currency || 'INR' })}
                                                </td>
                                                <td className='p-2'>{paymentChip(order.paymentStatus)}</td>
                                                <td className='p-2'>{fulfillmentChip(order.fulfillmentStatus)}</td>
                                                <td className='p-2 text-right'>
                                                    {order.hasInvoice && (
                                                        <a
                                                            href={WEBSITE_INVOICE_DOWNLOAD(order.orderNumber)}
                                                            target='_blank'
                                                            rel='noopener'
                                                            title='Download invoice'
                                                            className='inline-flex items-center gap-1 text-xs text-[#C9A24B] hover:text-[#F0D77C] transition-colors'
                                                        >
                                                            <FiDownload size={12} /> Invoice
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default Orders
