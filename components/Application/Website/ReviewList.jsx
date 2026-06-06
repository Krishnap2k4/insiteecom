'use client'
import Image from 'next/image'
import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Star, CheckCircle, Clock, XCircle, ThumbsUp, Flag } from 'lucide-react'
import usericon from '@/public/assets/images/user.png'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'

dayjs.extend(relativeTime)

const Stars = ({ value }) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    return (
        <span className='inline-flex items-center gap-0.5'>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < n ? 'text-[#F0D77C] fill-[#F0D77C]' : 'text-white/20'} />
            ))}
        </span>
    )
}

const STATUS_BADGE = {
    pending: { Icon: Clock, cls: 'bg-[#C9A24B]/15 text-[#F0D77C]/80 border border-[#C9A24B]/30', text: 'Awaiting moderation' },
    rejected: { Icon: XCircle, cls: 'bg-red-500/15 text-red-400 border border-red-500/30', text: 'Not approved' },
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
        <div className='py-5 border-b border-[#C9A24B]/10 last:border-b-0'>
            <div className='flex gap-4'>
                <Image
                    src={review?.avatar?.url || usericon.src}
                    width={44}
                    height={44}
                    alt='user'
                    className='rounded-full w-11 h-11 object-cover border-2 border-[#C9A24B]/30'
                />
                <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-medium text-sm text-white'>{review.reviewedBy || 'Anonymous'}</p>
                        {review.verifiedBuyer && (
                            <span className='inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#C9A24B]/15 text-[#F0D77C]/80 border border-[#C9A24B]/30'>
                                <CheckCircle size={10} /> Verified buyer
                            </span>
                        )}
                        {review.isMine && badge && (
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 ${badge.cls}`}>
                                <badge.Icon size={10} /> {badge.text}
                            </span>
                        )}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                        <Stars value={review.rating} />
                        <span className='text-xs text-white/40'>{dayjs(review.createdAt).fromNow()}</span>
                    </div>
                    <h4 className='font-semibold mt-2 text-sm text-white'>{review.title}</h4>
                    <p className='mt-1 text-sm text-white/60 whitespace-pre-wrap'>{review.review}</p>

                    {Array.isArray(review.mediaUrls) && review.mediaUrls.length > 0 && (
                        <div className='mt-3 flex flex-wrap gap-2'>
                            {review.mediaUrls.map((u, i) => (
                                <a key={i} href={u} target='_blank' rel='noopener noreferrer' className='block w-16 h-16 border border-[#C9A24B]/30 overflow-hidden'>
                                    <Image src={u} alt='' width={64} height={64} className='w-full h-full object-cover' />
                                </a>
                            ))}
                        </div>
                    )}

                    {review.reply?.text && (
                        <div className='mt-3 border-l-2 border-[#C9A24B] bg-[#C9A24B]/5 px-3 py-2'>
                            <p className='text-xs text-white/40 mb-0.5'>
                                <strong className='text-[#F0D77C]/80'>{review.reply.byName || 'Support team'}</strong> · {dayjs(review.reply.at).fromNow()}
                            </p>
                            <p className='text-sm text-white/60 whitespace-pre-wrap'>{review.reply.text}</p>
                        </div>
                    )}

                    {review.status === 'approved' && (
                        <div className='mt-3 flex items-center gap-4 text-xs text-white/40'>
                            <button
                                type='button'
                                onClick={vote}
                                disabled={busy}
                                className={`inline-flex items-center gap-1 hover:text-[#F0D77C] transition cursor-pointer ${helpfulByMe ? 'text-[#F0D77C]' : ''}`}
                            >
                                <ThumbsUp size={12} /> Helpful{helpfulCount > 0 ? ` (${helpfulCount})` : ''}
                            </button>
                            {!review.isMine && (
                                <button
                                    type='button'
                                    onClick={report}
                                    disabled={busy}
                                    className='inline-flex items-center gap-1 hover:text-red-400 transition cursor-pointer'
                                >
                                    <Flag size={12} /> Report
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
