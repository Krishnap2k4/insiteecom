'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { WEBSITE_MESSAGES, WEBSITE_ORDER_DETAILS } from '@/routes/WebsiteRoute'
import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FiUser, FiUserCheck } from 'react-icons/fi'

const breadCrumb = {
    title: 'Conversation',
    links: [{ label: 'Messages', href: WEBSITE_MESSAGES }, { label: 'Conversation' }],
}

const statusChip = (status) => {
    const palette = {
        open: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        resolved: 'bg-sky-100 text-sky-700',
        closed: 'bg-gray-100 text-gray-600',
    }
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${palette[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    )
}

const formatTime = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
})

const MessageDetail = ({ params }) => {
    const { id } = use(params)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reply, setReply] = useState('')
    const [sending, setSending] = useState(false)
    const listRef = useRef(null)

    const load = async () => {
        try {
            const { data: res } = await axios.get(`/api/support/conversations/${id}`)
            if (res?.success) setData(res.data)
            else setData(null)
        } finally { setLoading(false) }
    }

    useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

    // Light polling so admin replies show up without manual refresh.
    useEffect(() => {
        const t = setInterval(() => {
            if (document.visibilityState === 'visible') load()
        }, 20000)
        return () => clearInterval(t)
    /* eslint-disable-next-line */
    }, [id])

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, [data?.messages])

    const send = async () => {
        const body = reply.trim()
        if (!body) return
        setSending(true)
        try {
            const { data: res } = await axios.post(`/api/support/conversations/${id}/messages`, { body })
            if (!res?.success) throw new Error(res?.message || 'Could not send.')
            setReply('')
            await load()
        } catch (err) { showToast('error', err.message) }
        finally { setSending(false) }
    }

    if (loading) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
                </UserPanelLayout>
            </div>
        )
    }
    if (!data?.conversation) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border rounded p-10 text-center text-red-500 font-semibold'>Conversation not found.</div>
                </UserPanelLayout>
            </div>
        )
    }

    const conv = data.conversation
    const messages = data.messages || []
    const isClosed = conv.status === 'resolved' || conv.status === 'closed'

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <UserPanelLayout>
                <div className='border rounded shadow-sm flex flex-col h-[calc(100vh-260px)] min-h-[400px]'>
                    <div className='px-5 py-3 border-b flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                            <h1 className='text-lg font-semibold truncate'>{conv.subject || 'Conversation'}</h1>
                            {conv.relatedOrder?.orderNumber && (
                                <p className='text-xs text-gray-500 mt-0.5'>
                                    Linked to order <Link href={WEBSITE_ORDER_DETAILS(conv.relatedOrder.orderNumber)} className='text-primary hover:underline'>{conv.relatedOrder.orderNumber}</Link>
                                </p>
                            )}
                        </div>
                        {statusChip(conv.status)}
                    </div>

                    <div ref={listRef} className='flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50'>
                        {messages.length === 0 && (
                            <p className='text-center text-sm text-gray-500'>No messages yet.</p>
                        )}
                        {messages.map((m) => {
                            const mine = m.authorRole === 'customer'
                            return (
                                <div key={m._id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                                    {!mine && (
                                        <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                                            <FiUserCheck size={14} />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border rounded-tl-sm'}`}>
                                        <p className='text-sm whitespace-pre-wrap break-words'>{m.body}</p>
                                        <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>{formatTime(m.createdAt)}</p>
                                    </div>
                                    {mine && (
                                        <div className='w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0'>
                                            <FiUser size={14} />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className='border-t p-3 bg-white'>
                        {isClosed ? (
                            <p className='text-sm text-center text-gray-500'>
                                This conversation is {conv.status}. Send a reply below to re-open it.
                            </p>
                        ) : null}
                        <div className='flex gap-2 items-end mt-2'>
                            <Textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder='Write a message…'
                                className='resize-none'
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send()
                                }}
                            />
                            <ButtonLoading type='button' text='Send' loading={sending} onClick={send} disabled={!reply.trim()} />
                        </div>
                        <p className='text-[11px] text-gray-400 mt-1'>Press ⌘/Ctrl + Enter to send</p>
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default MessageDetail
