'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'
import { showToast } from '@/lib/showToast'
import {
    ADMIN_DASHBOARD,
    ADMIN_REVIEW_SHOW,
} from '@/routes/AdminPanelRoute'
import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import { use, useState } from 'react'
import { FiCheckCircle, FiClock, FiFlag, FiThumbsUp, FiXCircle } from 'react-icons/fi'
import { IoStar, IoStarOutline } from 'react-icons/io5'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_REVIEW_SHOW, label: 'Reviews' },
    { href: '', label: 'Details' },
]

const STATUS = {
    pending: { Icon: FiClock, cls: 'bg-amber-100 text-amber-700', text: 'Pending' },
    approved: { Icon: FiCheckCircle, cls: 'bg-emerald-100 text-emerald-700', text: 'Approved' },
    rejected: { Icon: FiXCircle, cls: 'bg-red-100 text-red-700', text: 'Rejected' },
}

const Stars = ({ value }) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    return (
        <span className='inline-flex items-center'>
            {Array.from({ length: 5 }).map((_, i) => i < n
                ? <IoStar key={i} className='text-yellow-500' size={16} />
                : <IoStarOutline key={i} className='text-gray-300' size={16} />)}
        </span>
    )
}

const ReviewModeration = ({ params }) => {
    const { id } = use(params)
    const { data, loading, refetch } = useFetch(`/api/admin/reviews/${id}`)
    const review = data?.success ? data.data : null
    const [busy, setBusy] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [replyOpen, setReplyOpen] = useState(false)
    const [replyText, setReplyText] = useState('')

    const act = async (payload, successMsg) => {
        setBusy(true)
        try {
            const { data: res } = await axios.put(`/api/admin/reviews/${id}`, payload)
            if (!res?.success) throw new Error(res?.message)
            showToast('success', successMsg || res.message)
            await refetch()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    if (loading) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
            </div>
        )
    }
    if (!review) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-red-500 font-semibold'>Review not found.</div>
            </div>
        )
    }

    const meta = STATUS[review.status] || STATUS.pending

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <div className='flex items-start justify-between gap-3 mb-5'>
                <div>
                    <h1 className='text-2xl font-semibold flex items-center gap-2'>
                        <Stars value={review.rating} />
                        <span>{review.title}</span>
                    </h1>
                    <p className='text-sm text-gray-500 mt-1'>
                        By {review.user?.name || review.user?.email || 'Anonymous'} on{' '}
                        <Link href={`/admin/product/edit/${review.product?._id || ''}`} className='text-primary hover:underline'>
                            {review.product?.name || 'Product'}
                        </Link>{' '}
                        · {dayjs(review.createdAt).format('DD MMM YYYY')}
                    </p>
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${meta.cls}`}>
                        <meta.Icon size={12} /> {meta.text}
                    </span>
                    {review.verifiedBuyer && (
                        <span className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700'>
                            <FiCheckCircle size={12} /> Verified buyer
                        </span>
                    )}
                    {(review.reportedCount || 0) > 0 && (
                        <span className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700'>
                            <FiFlag size={12} /> {review.reportedCount} report{review.reportedCount === 1 ? '' : 's'}
                        </span>
                    )}
                    <span className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700'>
                        <FiThumbsUp size={12} /> {review.helpfulCount || 0}
                    </span>
                </div>
            </div>

            <div className='grid lg:grid-cols-[2fr_1fr] gap-5'>
                <Card className='py-0 rounded shadow-sm'>
                    <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                        <h4 className='font-semibold'>Review</h4>
                    </CardHeader>
                    <CardContent className='p-4'>
                        <p className='whitespace-pre-wrap text-sm text-gray-700'>{review.review}</p>
                        {Array.isArray(review.mediaUrls) && review.mediaUrls.length > 0 && (
                            <div className='mt-4 flex flex-wrap gap-2'>
                                {review.mediaUrls.map((url, i) => (
                                    <a key={i} href={url} target='_blank' rel='noopener noreferrer' className='block w-20 h-20 border rounded overflow-hidden'>
                                        <Image src={url} alt='' width={80} height={80} className='w-full h-full object-cover' />
                                    </a>
                                ))}
                            </div>
                        )}
                        {review.rejectionReason && (
                            <div className='mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm'>
                                <p className='text-xs text-red-700 mb-1'>Rejected with reason:</p>
                                <p className='text-red-900'>{review.rejectionReason}</p>
                            </div>
                        )}
                        {review.reply?.text && (
                            <div className='mt-4 border-l-2 border-gray-900 bg-gray-50 p-3 rounded-r'>
                                <p className='text-xs text-gray-500 mb-0.5'>
                                    <strong className='text-gray-700'>{review.reply.byName}</strong> · {dayjs(review.reply.at).format('DD MMM YYYY HH:mm')}
                                </p>
                                <p className='text-sm text-gray-700 whitespace-pre-wrap'>{review.reply.text}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Moderation</h4>
                        </CardHeader>
                        <CardContent className='p-3 space-y-2'>
                            <Button
                                type='button'
                                className='w-full'
                                disabled={busy || review.status === 'approved'}
                                onClick={() => act({ action: 'approve' }, 'Review approved.')}
                            >
                                <FiCheckCircle className='mr-1' /> Approve
                            </Button>
                            <Button
                                type='button'
                                variant='outline'
                                className='w-full'
                                disabled={busy || review.status === 'rejected'}
                                onClick={() => { setRejectReason(''); setRejectOpen(true) }}
                            >
                                <FiXCircle className='mr-1' /> Reject
                            </Button>
                            <Button
                                type='button'
                                variant='outline'
                                className='w-full'
                                disabled={busy}
                                onClick={() => { setReplyText(review.reply?.text || ''); setReplyOpen(true) }}
                            >
                                {review.reply?.text ? 'Edit reply' : 'Reply to customer'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Customer</h4>
                        </CardHeader>
                        <CardContent className='p-3 text-sm'>
                            <p className='font-medium'>{review.user?.name || '—'}</p>
                            <p className='text-gray-500'>{review.user?.email}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject review</DialogTitle></DialogHeader>
                    <Label className='mb-1.5 block'>Reason (sent to the customer)</Label>
                    <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder='Why is this review being rejected?' />
                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <ButtonLoading
                            type='button'
                            text='Reject'
                            loading={busy}
                            onClick={async () => { await act({ action: 'reject', rejectionReason: rejectReason }, 'Review rejected.'); setRejectOpen(false) }}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reply to customer</DialogTitle></DialogHeader>
                    <Label className='mb-1.5 block'>Reply</Label>
                    <Textarea rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder='Your reply will appear under the review.' />
                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={() => setReplyOpen(false)}>Cancel</Button>
                        <ButtonLoading
                            type='button'
                            text='Post reply'
                            loading={busy}
                            onClick={async () => { await act({ action: 'reply', replyText }, 'Reply posted.'); setReplyOpen(false) }}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ReviewModeration
