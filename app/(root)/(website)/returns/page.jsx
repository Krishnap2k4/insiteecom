'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_ORDER_DETAILS, WEBSITE_RETURN_DETAILS, USER_ORDERS } from '@/routes/WebsiteRoute'
import Link from 'next/link'

const breadCrumbData = { title: 'Returns', links: [{ label: 'Returns' }] }

const statusChip = (status) => {
    const palette = {
        requested: 'bg-amber-500/20 text-amber-400',
        approved: 'bg-sky-500/20 text-sky-400',
        received: 'bg-indigo-500/20 text-indigo-400',
        refunded: 'bg-emerald-500/20 text-emerald-400',
        replaced: 'bg-emerald-500/20 text-emerald-400',
        rejected: 'bg-red-500/20 text-red-400',
        cancelled: 'bg-white/10 text-white/50',
    }
    return (
        <span className={`text-xs px-2 py-0.5 capitalize ${palette[status] || 'bg-white/10 text-white/50'}`}>
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
                <div className='border border-[#C9A24B]/20 bg-[#0a0805]'>
                    <div className='p-5 text-xl font-serif-display border-b border-[#C9A24B]/20 flex items-center justify-between'>
                        <span className='text-[#F0D77C]'>Returns &amp; exchanges</span>
                        <Link href={USER_ORDERS} className='text-sm font-normal text-[#C9A24B] hover:text-[#F0D77C] transition-colors'>Go to Orders</Link>
                    </div>
                    <div className='p-5'>
                        {loading ? (
                            <div className='text-center py-10 text-white/50'>Loading…</div>
                        ) : list.length === 0 ? (
                            <div className='text-center py-10 text-white/40'>
                                You haven&apos;t requested any returns yet. Open one of your delivered orders to start a return or exchange.
                            </div>
                        ) : (
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='text-left text-[11px] uppercase tracking-[0.2em] text-white/50'>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Request #</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Order #</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Type</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Items</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Requested</th>
                                            <th className='p-2 border-b border-[#C9A24B]/20'>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.map((r) => (
                                            <tr key={r._id} className='hover:bg-white/5 transition-colors border-b border-[#C9A24B]/10'>
                                                <td className='p-2 text-sm'>
                                                    <Link href={WEBSITE_RETURN_DETAILS(r.returnNumber)} className='font-medium text-[#C9A24B] hover:text-[#F0D77C] underline-offset-2 hover:underline transition-colors'>{r.returnNumber}</Link>
                                                </td>
                                                <td className='p-2 text-sm text-white/80'>
                                                    {r.order?.orderNumber ? (
                                                        <Link href={WEBSITE_ORDER_DETAILS(r.order.orderNumber)} className='hover:text-[#F0D77C] hover:underline transition-colors'>{r.order.orderNumber}</Link>
                                                    ) : '—'}
                                                </td>
                                                <td className='p-2 text-sm capitalize text-white/70'>{r.type}</td>
                                                <td className='p-2 text-sm text-white/70'>{r.itemCount}</td>
                                                <td className='p-2 text-sm text-white/50'>
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
