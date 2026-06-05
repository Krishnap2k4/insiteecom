'use client'
import Image from 'next/image'
import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { IoStar, IoStarOutline } from 'react-icons/io5'
import { FiCheckCircle, FiClock, FiFlag, FiThumbsUp, FiXCircle } from 'react-icons/fi'
import usericon from '@/public/assets/images/user.png'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'

dayjs.extend(relativeTime)

const Stars = ({ value }) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    return (
        <span className='inline-flex items-center'>
            {Array.from({ length: 5 }).map((_, i) => i < n
                ? <IoStar key={i} className='text-yellow-500' size={14} />
                : <IoStarOutline key={i} className='text-gray-300' size={14} />)}
        </span>
    )
}

const STATUS_BADGE = {
    pending: { Icon: FiClock, cls: 'bg-amber-100 text-amber-700', text: 'Awaiting moderation' },
    rejected: { Icon: FiXCircle, cls: 'bg-red-100 text-red-700', text: 'Not approved' },
}

/**
 * One review row. Customer's own pending/rejected reviews show a
 * moderation pill so they know the state. Approved reviews expose
 * Helpful and Report actions.
 */
const ReviewList = ({ review, onAfterChange }) => {
    const [helpfulByMe, setHelpfulByMe] = useState(Boolean(review.helpfulByMe))
    const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0)
    const [busy, setBusy] = useState(false)

    const vote = async () => {
        if (busy) return
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/review/${review._id}/helpful`)
            if (!res?.success) throw new Error(res?.message)
            setHelpfulByMe(res.data.helpfulByMe)
            setHelpfulCount(res.data.helpfulCount)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const report = async () => {
        if (!confirm('Report this review as inappropriate?')) return
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/review/${review._id}/report`)
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            onAfterChange && onAfterChange()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const badge = STATUS_BADGE[review.status]

    return (
        <div className='py-5 border-b last:border-b-0'>
            <div className='flex gap-4'>
                <Image
                    src={review?.avatar?.url || usericon.src}
                    width={44}
                    height={44}
                    alt='user'
                    className='rounded-full w-11 h-11 object-cover border'
                />
                <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-medium text-sm'>{review.reviewedBy || 'Anonymous'}</p>
                        {review.verifiedBuyer && (
                            <span className='inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700'>
                                <FiCheckCircle size={11} /> Verified buyer
                            </span>
                        )}
                        {review.isMine && badge && (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>
                                <badge.Icon size={11} /> {badge.text}
                            </span>
                        )}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                        <Stars value={review.rating} />
                        <span className='text-xs text-gray-500'>{dayjs(review.createdAt).fromNow()}</span>
                    </div>
                    <h4 className='font-semibold mt-2 text-sm'>{review.title}</h4>
                    <p className='mt-1 text-sm text-gray-700 whitespace-pre-wrap'>{review.review}</p>

                    {Array.isArray(review.mediaUrls) && review.mediaUrls.length > 0 && (
                        <div className='mt-3 flex flex-wrap gap-2'>
                            {review.mediaUrls.map((u, i) => (
                                <a key={i} href={u} target='_blank' rel='noopener noreferrer' className='block w-16 h-16 border rounded overflow-hidden'>
                                    <Image src={u} alt='' width={64} height={64} className='w-full h-full object-cover' />
                                </a>
                            ))}
                        </div>
                    )}

                    {review.reply?.text && (
                        <div className='mt-3 border-l-2 border-gray-900 bg-gray-50 px-3 py-2 rounded-r'>
                            <p className='text-xs text-gray-500 mb-0.5'>
                                <strong className='text-gray-700'>{review.reply.byName || 'Support team'}</strong> · {dayjs(review.reply.at).fromNow()}
                            </p>
                            <p className='text-sm text-gray-700 whitespace-pre-wrap'>{review.reply.text}</p>
                        </div>
                    )}

                    {review.status === 'approved' && (
                        <div className='mt-3 flex items-center gap-4 text-xs text-gray-500'>
                            <button
                                type='button'
                                onClick={vote}
                                disabled={busy}
                                className={`inline-flex items-center gap-1 hover:text-gray-900 ${helpfulByMe ? 'text-primary' : ''}`}
                            >
                                <FiThumbsUp size={12} /> Helpful{helpfulCount > 0 ? ` (${helpfulCount})` : ''}
                            </button>
                            {!review.isMine && (
                                <button
                                    type='button'
                                    onClick={report}
                                    disabled={busy}
                                    className='inline-flex items-center gap-1 hover:text-red-600'
                                >
                                    <FiFlag size={12} /> Report
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ReviewList
