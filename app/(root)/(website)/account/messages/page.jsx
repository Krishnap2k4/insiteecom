'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_MESSAGES_NEW, WEBSITE_MESSAGE_DETAILS } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { FiMessageSquare, FiPlus } from 'react-icons/fi'

const breadCrumb = { title: 'Messages', links: [{ label: 'Messages' }] }

const statusChip = (status) => {
    const palette = {
        open: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        resolved: 'bg-sky-100 text-sky-700',
        closed: 'bg-gray-100 text-gray-600',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${palette[status] || 'bg-gray-100 text-gray-600'}`}>
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
    const { data, loading } = useFetch('/api/support/conversations')
    const list = data?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <UserPanelLayout>
                <div className='shadow rounded'>
                    <div className='p-5 flex items-center justify-between border-b'>
                        <h2 className='text-xl font-semibold'>Messages</h2>
                        <Button asChild size='sm'>
                            <Link href={WEBSITE_MESSAGES_NEW()} className='inline-flex items-center gap-1'>
                                <FiPlus /> New conversation
                            </Link>
                        </Button>
                    </div>
                    <div>
                        {loading ? (
                            <div className='p-10 text-center text-gray-500'>Loading…</div>
                        ) : list.length === 0 ? (
                            <div className='p-10 text-center text-gray-500'>
                                <FiMessageSquare className='mx-auto mb-3 text-3xl text-gray-300' />
                                <p>You haven&apos;t started any conversations yet.</p>
                                <Button asChild className='mt-4'>
                                    <Link href={WEBSITE_MESSAGES_NEW()}>Start one</Link>
                                </Button>
                            </div>
                        ) : (
                            <ul className='divide-y'>
                                {list.map((c) => (
                                    <li key={c._id}>
                                        <Link
                                            href={WEBSITE_MESSAGE_DETAILS(c._id)}
                                            className={`flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition ${c.customerUnread ? 'bg-emerald-50/40' : ''}`}
                                        >
                                            <div className='min-w-0 flex-1'>
                                                <div className='flex items-center gap-2'>
                                                    {c.customerUnread && <span className='w-2 h-2 rounded-full bg-emerald-500 shrink-0' />}
                                                    <p className='font-medium truncate'>{c.subject || 'Conversation'}</p>
                                                    {statusChip(c.status)}
                                                </div>
                                                <p className='text-sm text-gray-500 truncate mt-1'>
                                                    {c.lastMessageBy === 'customer' ? 'You: ' : 'Support: '}
                                                    {c.lastMessagePreview || '—'}
                                                </p>
                                                {c.relatedOrder?.orderNumber && (
                                                    <p className='text-xs text-gray-400 mt-1'>Order {c.relatedOrder.orderNumber}</p>
                                                )}
                                            </div>
                                            <span className='text-xs text-gray-400 shrink-0'>{fromTime(c.lastMessageAt)}</span>
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
