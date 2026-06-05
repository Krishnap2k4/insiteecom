'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_ORDER_DETAILS, WEBSITE_RETURN_DETAILS, USER_ORDERS } from '@/routes/WebsiteRoute'
import Link from 'next/link'

const breadCrumbData = { title: 'Returns', links: [{ label: 'Returns' }] }

const statusChip = (status) => {
    const palette = {
        requested: 'bg-amber-100 text-amber-700',
        approved: 'bg-sky-100 text-sky-700',
        received: 'bg-indigo-100 text-indigo-700',
        refunded: 'bg-emerald-100 text-emerald-700',
        replaced: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-600',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${palette[status] || 'bg-gray-100 text-gray-600'}`}>
            {String(status || '—').replace('_', ' ')}
        </span>
    )
}

const Returns = () => {
    const { data, loading } = useFetch('/api/account/returns')
    const list = data?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className='shadow rounded'>
                    <div className='p-5 text-xl font-semibold border-b flex items-center justify-between'>
                        <span>Returns &amp; exchanges</span>
                        <Link href={USER_ORDERS} className='text-sm font-normal text-primary hover:underline'>Go to Orders</Link>
                    </div>
                    <div className='p-5'>
                        {loading ? (
                            <div className='text-center py-10'>Loading…</div>
                        ) : list.length === 0 ? (
                            <div className='text-center py-10 text-gray-500'>
                                You haven&apos;t requested any returns yet. Open one of your delivered orders to start a return or exchange.
                            </div>
                        ) : (
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='text-left text-xs uppercase tracking-wide text-gray-500'>
                                            <th className='p-2 border-b'>Request #</th>
                                            <th className='p-2 border-b'>Order #</th>
                                            <th className='p-2 border-b'>Type</th>
                                            <th className='p-2 border-b'>Items</th>
                                            <th className='p-2 border-b'>Requested</th>
                                            <th className='p-2 border-b'>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.map((r) => (
                                            <tr key={r._id} className='hover:bg-gray-50'>
                                                <td className='p-2 text-sm'>
                                                    <Link href={WEBSITE_RETURN_DETAILS(r.returnNumber)} className='font-medium text-primary hover:underline'>{r.returnNumber}</Link>
                                                </td>
                                                <td className='p-2 text-sm'>
                                                    {r.order?.orderNumber ? (
                                                        <Link href={WEBSITE_ORDER_DETAILS(r.order.orderNumber)} className='hover:underline'>{r.order.orderNumber}</Link>
                                                    ) : '—'}
                                                </td>
                                                <td className='p-2 text-sm capitalize'>{r.type}</td>
                                                <td className='p-2 text-sm'>{r.itemCount}</td>
                                                <td className='p-2 text-sm text-gray-500'>
                                                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className='p-2'>{statusChip(r.status)}</td>
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

export default Returns
