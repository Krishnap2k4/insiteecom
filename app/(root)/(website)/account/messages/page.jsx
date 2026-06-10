'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_MESSAGES_NEW, WEBSITE_MESSAGE_DETAILS } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { FiMessageSquare, FiPlus } from 'react-icons/fi'
import useRequireAuth from '@/hooks/useRequireAuth'

const breadCrumb = { title: 'Messages', links: [{ label: 'Messages' }] }

const statusChip = (status) => {
    const palette = {
        open: 'bg-emerald-500/20 text-emerald-400',
        pending: 'bg-amber-500/20 text-amber-400',
        resolved: 'bg-sky-500/20 text-sky-400',
        closed: 'bg-white/10 text-white/50',
    }
    return (
        <span className={`text-xs px-2 py-0.5 capitalize ${palette[status] || 'bg-white/10 text-white/50'}`}>
            {status}
        </span>
    )
}

const fromTime = (d) => {
    if (!d) return ''
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    return `${days}d ago`
}

const Messages = () => {
    const { isLoggedIn, rehydrated } = useRequireAuth()
    const { data, loading } = useFetch('/api/support/conversations')
    if (!rehydrated || !isLoggedIn) return null
    const list = data?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <UserPanelLayout>
                <div className='border border-[#C9A24B]/20 bg-[#0a0805]'>
                    <div className='p-5 flex items-center justify-between border-b border-[#C9A24B]/20'>
                        <h2 className='text-xl font-serif-display text-[#F0D77C]'>Messages</h2>
                        <Link href={WEBSITE_MESSAGES_NEW()} className='btn-dark-gold inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold uppercase tracking-widest'>
                            <FiPlus /> New conversation
                        </Link>
                    </div>
                    <div>
                        {loading ? (
                            <div className='p-10 text-center text-white/50'>Loading…</div>
                        ) : list.length === 0 ? (
                            <div className='p-10 text-center text-white/50'>
                                <FiMessageSquare className='mx-auto mb-3 text-3xl text-[#C9A24B]/30' />
                                <p>You haven&apos;t started any conversations yet.</p>
                                <Link href={WEBSITE_MESSAGES_NEW()} className='btn-dark-gold inline-block mt-4 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                                    Start one
                                </Link>
                            </div>
                        ) : (
                            <ul className='divide-y divide-[#C9A24B]/10'>
                                {list.map((c) => (
                                    <li key={c._id}>
                                        <Link
                                            href={WEBSITE_MESSAGE_DETAILS(c._id)}
                                            className={`flex items-start justify-between gap-4 px-5 py-4 hover:bg-white/5 transition-colors ${c.customerUnread ? 'bg-[#C9A24B]/10' : ''}`}
                                        >
                                            <div className='min-w-0 flex-1'>
                                                <div className='flex items-center gap-2'>
                                                    {c.customerUnread && <span className='w-2 h-2 rounded-full bg-[#C9A24B] shrink-0' />}
                                                    <p className='font-medium truncate text-white'>{c.subject || 'Conversation'}</p>
                                                    {statusChip(c.status)}
                                                </div>
                                                <p className='text-sm text-white/60 truncate mt-1'>
                                                    {c.lastMessageBy === 'customer' ? 'You: ' : 'Support: '}
                                                    {c.lastMessagePreview || '—'}
                                                </p>
                                                {c.relatedOrder?.orderNumber && (
                                                    <p className='text-xs text-white/40 mt-1'>Order {c.relatedOrder.orderNumber}</p>
                                                )}
                                            </div>
                                            <span className='text-xs text-white/40 shrink-0'>{fromTime(c.lastMessageAt)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default Messages
