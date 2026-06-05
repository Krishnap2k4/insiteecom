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
        paid: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        failed: 'bg-red-100 text-red-700',
        refunded: 'bg-gray-200 text-gray-700',
        partially_refunded: 'bg-gray-200 text-gray-700',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {String(status || '').replace('_', ' ')}
        </span>
    )
}
const fulfillmentChip = (status) => {
    const map = {
        fulfilled: 'bg-emerald-100 text-emerald-700',
        partial: 'bg-sky-100 text-sky-700',
        unfulfilled: 'bg-amber-100 text-amber-700',
        cancelled: 'bg-red-100 text-red-700',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
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
                <div className='shadow rounded'>
                    <div className='p-5 text-xl font-semibold border-b flex items-center justify-between'>
                        <span>Orders</span>
                        <Link href={WEBSITE_SHOP} className='text-sm font-normal text-primary hover:underline'>Continue Shopping</Link>
                    </div>

                    <div className='p-5'>
                        {loading ? (
                            <div className='text-center py-10'>Loading…</div>
                        ) : list.length === 0 ? (
                            <div className='text-center py-10 text-gray-500'>
                                You haven&apos;t placed any orders yet.
                            </div>
                        ) : (
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='text-left text-xs uppercase tracking-wide text-gray-500'>
                                            <th className='p-2 border-b'>Order #</th>
                                            <th className='p-2 border-b'>Placed</th>
                                            <th className='p-2 border-b'>Items</th>
                                            <th className='p-2 border-b'>Amount</th>
                                            <th className='p-2 border-b'>Payment</th>
                                            <th className='p-2 border-b'>Delivery</th>
                                            <th className='p-2 border-b'></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.map((order) => (
                                            <tr key={order._id} className='hover:bg-gray-50'>
                                                <td className='p-2 text-sm'>
                                                    <Link
                                                        className='font-medium underline-offset-2 hover:underline text-primary'
                                                        href={WEBSITE_ORDER_DETAILS(order.orderNumber)}
                                                    >
                                                        {order.orderNumber}
                                                    </Link>
                                                    {order.hasActiveReturn && (
                                                        <span className='ml-2 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide'>
                                                            Return active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className='p-2 text-sm text-gray-500'>
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </td>
                                                <td className='p-2 text-sm'>{order.itemCount}</td>
                                                <td className='p-2 text-sm font-medium'>
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
                                                            className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
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
