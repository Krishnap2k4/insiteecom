'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import Select from '@/components/Application/Select'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import {
    ADMIN_DASHBOARD,
    ADMIN_ORDER_DETAILS,
    ADMIN_SUPPORT_SHOW,
} from '@/routes/AdminPanelRoute'
import Link from 'next/link'
import { use, useEffect, useRef, useState } from 'react'
import { FiUser, FiUserCheck } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SUPPORT_SHOW, label: 'Support' },
    { href: '', label: 'Conversation' },
]

const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
]
const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
]

const formatTime = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
})

const AdminSupportDetail = ({ params }) => {
    const { id } = use(params)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reply, setReply] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [sending, setSending] = useState(false)
    const [savingMeta, setSavingMeta] = useState(false)
    const listRef = useRef(null)

    const load = async () => {
        try {
            const { data: res } = await axios.get(`/api/admin/support/${id}`)
            if (res?.success) setData(res.data); else setData(null)
        } finally { setLoading(false) }
    }

    useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

    // Poll for customer replies.
    useEffect(() => {
        const t = setInterval(() => {
            if (document.visibilityState === 'visible') load()
        }, 30000)
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
            const { data: res } = await axios.post(`/api/admin/support/${id}/messages`, { body, isInternal })
            if (!res?.success) throw new Error(res?.message || 'Could not send.')
            setReply('')
            setIsInternal(false)
            await load()
        } catch (err) { showToast('error', err.message) }
        finally { setSending(false) }
    }

    const updateMeta = async (patch) => {
        setSavingMeta(true)
        try {
            const { data: res } = await axios.put(`/api/admin/support/${id}`, patch)
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            await load()
        } catch (err) { showToast('error', err.message) }
        finally { setSavingMeta(false) }
    }

    if (loading) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
            </div>
        )
    }
    if (!data?.conversation) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-red-500 font-semibold'>Conversation not found.</div>
            </div>
        )
    }

    const conv = data.conversation
    const messages = data.messages || []

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <div className='grid lg:grid-cols-[2fr_1fr] gap-5'>
                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <div className='flex items-start justify-between gap-3'>
                                <div className='min-w-0'>
                                    <h4 className='text-lg font-semibold truncate'>{conv.subject || 'Conversation'}</h4>
                                    {conv.relatedOrder?.orderNumber && (
                                        <p className='text-xs text-gray-500 mt-0.5'>
                                            Order <Link href={ADMIN_ORDER_DETAILS(conv.relatedOrder.orderNumber)} className='text-primary hover:underline'>{conv.relatedOrder.orderNumber}</Link>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='p-0'>
                            <div ref={listRef} className='max-h-[60vh] overflow-y-auto p-5 space-y-4 bg-gray-50'>
                                {messages.length === 0 ? (
                                    <p className='text-center text-sm text-gray-500'>No messages yet.</p>
                                ) : messages.map((m) => {
                                    const mine = m.authorRole === 'admin' || m.authorRole === 'support'
                                    if (m.isInternal) {
                                        return (
                                            <div key={m._id} className='mx-auto max-w-[85%] bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs'>
                                                <p className='font-medium text-amber-900'>Internal note · {m.author?.name || 'Admin'}</p>
                                                <p className='whitespace-pre-wrap text-amber-800 mt-1'>{m.body}</p>
                                                <p className='text-[10px] text-amber-700 mt-1'>{formatTime(m.createdAt)}</p>
                                            </div>
                                        )
                                    }
                                    return (
                                        <div key={m._id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                                            {!mine && (
                                                <div className='w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0'>
                                                    <FiUser size={14} />
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border rounded-tl-sm'}`}>
                                                <p className='text-sm whitespace-pre-wrap break-words'>{m.body}</p>
                                                <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>{m.author?.name || (mine ? 'Support' : 'Customer')} · {formatTime(m.createdAt)}</p>
                                            </div>
                                            {mine && (
                                                <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                                                    <FiUserCheck size={14} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className='border-t p-3'>
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={isInternal ? 'Internal note (customer can NOT see this)…' : 'Reply to the customer…'}
                                    rows={3}
                                    className={isInternal ? 'border-amber-300 bg-amber-50' : ''}
                                />
                                <div className='flex items-center justify-between mt-2'>
                                    <div className='flex items-center gap-2'>
                                        <Switch checked={isInternal} onCheckedChange={setIsInternal} id='internal-toggle' />
                                        <label htmlFor='internal-toggle' className='text-xs text-gray-500 cursor-pointer'>
                                            Internal note
                                        </label>
                                    </div>
                                    <ButtonLoading
                                        type='button'
                                        text={isInternal ? 'Save note' : 'Send reply'}
                                        loading={sending}
                                        onClick={send}
                                        disabled={!reply.trim()}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Customer</h4>
                        </CardHeader>
                        <CardContent className='p-3 text-sm'>
                            <p className='font-medium'>{conv.user?.name || '—'}</p>
                            <p className='text-gray-500'>{conv.user?.email || ''}</p>
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Status</h4>
                        </CardHeader>
                        <CardContent className='p-3 space-y-3 text-sm'>
                            <div>
                                <Label className='mb-1.5 block text-xs text-gray-500'>Status</Label>
                                <Select
                                    options={STATUS_OPTIONS}
                                    selected={conv.status}
                                    setSelected={(v) => updateMeta({ status: v })}
                                    isMulti={false}
                                />
                            </div>
                            <div>
                                <Label className='mb-1.5 block text-xs text-gray-500'>Priority</Label>
                                <Select
                                    options={PRIORITY_OPTIONS}
                                    selected={conv.priority}
                                    setSelected={(v) => updateMeta({ priority: v })}
                                    isMulti={false}
                                />
                            </div>
                            {savingMeta && <p className='text-xs text-gray-400'>Saving…</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default AdminSupportDetail
