'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, ChevronDown } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import ReviewList from './ReviewList'
import ImageUploader from './ImageUploader'
import useFetch from '@/hooks/useFetch'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'

const Stars = ({ value, size = 14 }) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    return (
        <span className='inline-flex items-center gap-0.5'>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={size} className={i < n ? 'text-[#F0D77C] fill-[#F0D77C]' : 'text-white/20'} />
            ))}
        </span>
    )
}

const SORTS = [
    { key: 'most_helpful', label: 'Most helpful' },
    { key: 'newest', label: 'Newest first' },
    { key: 'highest', label: 'Highest rated' },
    { key: 'lowest', label: 'Lowest rated' },
    { key: 'with_photos', label: 'With photos' },
    { key: 'verified', label: 'Verified buyers' },
]

const RatingInput = ({ value, onChange }) => (
    <div className='flex items-center gap-1' role='radiogroup'>
        {[1, 2, 3, 4, 5].map((v) => (
            <button
                key={v}
                type='button'
                onClick={() => onChange(v)}
                aria-label={`${v} star${v > 1 ? 's' : ''}`}
                className='p-1 hover:scale-110 transition cursor-pointer'
            >
                <Star size={24} className={v <= value ? 'text-[#F0D77C] fill-[#F0D77C]' : 'text-white/20'} />
            </button>
        ))}
    </div>
)

const WriteDialog = ({ open, onOpenChange, productId, existing, onSaved }) => {
    const [rating, setRating] = useState(existing?.rating || 5)
    const [title, setTitle] = useState(existing?.title || '')
    const [body, setBody] = useState(existing?.review || '')
    const [mediaUrls, setMediaUrls] = useState(existing?.mediaUrls || [])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            setRating(existing?.rating || 5)
            setTitle(existing?.title || '')
            setBody(existing?.review || '')
            setMediaUrls(existing?.mediaUrls || [])
        }
    }, [open, existing])

    const submit = async () => {
        if (!title.trim() || !body.trim()) return showToast('error', 'Title and review are required.')
        if (rating < 1) return showToast('error', 'Please pick a rating.')
        setSubmitting(true)
        try {
            const { data: res } = await axios.post('/api/review/create', {
                product: productId,
                rating,
                title: title.trim(),
                review: body.trim(),
                mediaUrls,
            })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            onSaved && onSaved()
            onOpenChange(false)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-lg bg-[#0a0805] border-[#C9A24B]/30 text-white'>
                <DialogHeader>
                    <DialogTitle className='text-white font-serif-display text-xl'>{existing ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
                    <DialogDescription className='text-white/50 text-xs'>
                        Your review goes through moderation before it appears for other shoppers.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    <div>
                        <label className='block text-[10px] tracking-[0.3em] uppercase text-[#F0D77C]/80 mb-2'>Rating <span className='text-[#C9A24B]'>*</span></label>
                        <RatingInput value={rating} onChange={setRating} />
                    </div>
                    <div>
                        <label className='block text-[10px] tracking-[0.3em] uppercase text-[#F0D77C]/80 mb-2'>Title <span className='text-[#C9A24B]'>*</span></label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Summarise your experience'
                               className='bg-black/40 border-[#C9A24B]/40 text-white placeholder:text-white/30 focus-visible:ring-[#C9A24B]/30' />
                    </div>
                    <div>
                        <label className='block text-[10px] tracking-[0.3em] uppercase text-[#F0D77C]/80 mb-2'>Your review <span className='text-[#C9A24B]'>*</span></label>
                        <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder='What did you like or dislike?'
                                  className='bg-black/40 border-[#C9A24B]/40 text-white placeholder:text-white/30 focus-visible:ring-[#C9A24B]/30' />
                    </div>
                    <div>
                        <label className='block text-[10px] tracking-[0.3em] uppercase text-[#F0D77C]/80 mb-2'>Photos (optional)</label>
                        <ImageUploader
                            value={mediaUrls}
                            onChange={setMediaUrls}
                            max={5}
                            label='Upload photos'
                            helpText='Up to 5 photos. JPG, PNG, or WebP — 8 MB each.'
                        />
                    </div>
                </div>

                <DialogFooter className='gap-2'>
                    <button type='button' onClick={() => onOpenChange(false)}
                            className='border border-[#C9A24B]/30 text-white/70 hover:text-white px-5 py-2.5 text-sm transition cursor-pointer'>
                        Cancel
                    </button>
                    <button type='button' onClick={submit} disabled={submitting}
                            className='btn-gold uppercase text-[10px] tracking-[0.25em] font-bold px-6 py-3 cursor-pointer disabled:opacity-50'>
                        {submitting ? 'Submitting...' : (existing ? 'Save Changes' : 'Submit Review')}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Public reviews section for a product page. Shopify-style layout:
 *
 *   [ summary card with avg + distribution bars ] [ Write/Edit CTA ]
 *   [ sort dropdown ]
 *   [ review list, infinite-scroll via "Load more" ]
 */
const ProductReveiw = ({ productId }) => {
    const auth = useSelector((s) => s.authStore?.auth)
    const queryClient = useQueryClient()
    const [sort, setSort] = useState('most_helpful')
    const [writeOpen, setWriteOpen] = useState(false)

    const { data: detailsData } = useFetch(`/api/review/details?productId=${productId}`)
    const summary = detailsData?.data || {
        totalReview: 0, averageRating: '0.0', rating: {}, percentage: {}, withPhotos: 0, verifiedCount: 0,
    }

    const { data: canReviewData, refetch: refetchCan } = useFetch(`/api/review/can-review?productId=${productId}`)
    const existingReview = canReviewData?.data?.existingReview || null
    const authed = canReviewData?.data?.authed
    const verified = canReviewData?.data?.verified

    const queryKey = ['reviews', productId, sort]
    const {
        data: pages,
        fetchNextPage,
        hasNextPage,
        isFetching,
        refetch: refetchList,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 0 }) => {
            const { data: res } = await axios.get(`/api/review/get?productId=${productId}&sort=${sort}&page=${pageParam}`)
            if (!res?.success) throw new Error(res?.message || 'Failed to load reviews')
            return res.data
        },
        getNextPageParam: (last) => last.nextPage ?? undefined,
        initialPageParam: 0,
    })

    const reviews = useMemo(() => (pages?.pages || []).flatMap((p) => p.reviews || []), [pages])

    const handleSaved = () => {
        refetchCan()
        refetchList()
        queryClient.invalidateQueries({ queryKey: ['review-details', productId] })
    }

    return (
        <div className='border border-[#C9A24B]/20 bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e]'>
            {/* Header */}
            <div className='p-5 border-b border-[#C9A24B]/20 flex items-center gap-3'>
                <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                <h3 className='text-[11px] tracking-[0.4em] uppercase text-[#F0D77C] font-semibold'>Customer Reviews</h3>
                <span className='h-px w-4 bg-[#C9A24B]/50'></span>
            </div>

            {/* Summary + CTA */}
            <div className='p-6 grid lg:grid-cols-[1fr_2fr] gap-8 border-b border-[#C9A24B]/20'>
                <div>
                    <div className='flex items-baseline gap-3'>
                        <span className='font-serif-display text-5xl gold-text'>{summary.averageRating}</span>
                        <Stars value={summary.averageRating} size={18} />
                    </div>
                    <p className='text-sm text-white/50 mt-1'>
                        {summary.totalReview} review{summary.totalReview === 1 ? '' : 's'}
                    </p>
                    {summary.verifiedCount > 0 && (
                        <p className='text-xs text-[#F0D77C]/70 mt-1 inline-flex items-center gap-1'>
                            <CheckCircle size={11} /> {summary.verifiedCount} verified buyer{summary.verifiedCount === 1 ? '' : 's'}
                        </p>
                    )}

                    <div className='mt-5'>
                        {authed === false ? (
                            <Link href={WEBSITE_LOGIN}
                                  className='block w-full text-center btn-gold uppercase text-[10px] tracking-[0.25em] font-bold py-3'>
                                Log in to write a review
                            </Link>
                        ) : existingReview ? (
                            <button type='button' onClick={() => setWriteOpen(true)}
                                    className='w-full btn-dark-gold uppercase text-[10px] tracking-[0.25em] font-semibold py-3 cursor-pointer'>
                                Edit your review
                            </button>
                        ) : (
                            <button type='button' onClick={() => setWriteOpen(true)}
                                    className='w-full btn-gold uppercase text-[10px] tracking-[0.25em] font-bold py-3 cursor-pointer'>
                                Write a review
                            </button>
                        )}
                        {existingReview && existingReview.status === 'pending' && (
                            <p className='text-xs text-[#F0D77C]/60 mt-2 text-center'>Your review is awaiting moderation.</p>
                        )}
                        {existingReview && existingReview.status === 'rejected' && (
                            <p className='text-xs text-red-400 mt-2 text-center'>Your review was not approved. You can edit and resubmit.</p>
                        )}
                        {authed && !existingReview && verified && (
                            <p className='text-xs text-[#F0D77C]/70 mt-2 text-center inline-flex items-center gap-1 w-full justify-center'>
                                <CheckCircle size={11} /> You bought this — your review will be marked verified.
                            </p>
                        )}
                    </div>
                </div>

                {/* Rating distribution bars */}
                <div className='space-y-2'>
                    {[5, 4, 3, 2, 1].map((star) => {
                        const pct = Number(summary.percentage?.[star] || 0)
                        const count = Number(summary.rating?.[star] || 0)
                        return (
                            <div key={star} className='flex items-center gap-3'>
                                <span className='text-xs text-white/50 w-10'>{star} star</span>
                                <div className='flex-1 h-2 bg-white/10 overflow-hidden'>
                                    <div className='h-full bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] transition-all' style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className='text-xs text-white/50 w-8 text-right'>{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Sort bar */}
            <div className='px-5 py-3 flex items-center justify-between border-b border-[#C9A24B]/15 bg-black/20'>
                <p className='text-sm text-white/50'>
                    {reviews.length === 0 && summary.totalReview === 0
                        ? 'Be the first to review this product.'
                        : `Showing ${reviews.length} of ${summary.totalReview}`}
                </p>
                <div className='flex items-center gap-2'>
                    <label className='text-xs text-white/40'>Sort:</label>
                    <div className='relative'>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className='text-xs border border-[#C9A24B]/30 px-3 py-1.5 bg-[#0a0805] text-white/80 appearance-none pr-7 cursor-pointer focus:border-[#F0D77C] focus:outline-none'
                        >
                            {SORTS.map((s) => <option key={s.key} value={s.key} className='bg-[#0a0805] text-white'>{s.label}</option>)}
                        </select>
                        <ChevronDown size={12} className='absolute right-2 top-1/2 -translate-y-1/2 text-[#C9A24B] pointer-events-none' />
                    </div>
                </div>
            </div>

            {/* Review list */}
            <div className='px-5'>
                {reviews.length === 0 ? (
                    <p className='py-12 text-center text-sm text-white/40'>No reviews yet.</p>
                ) : (
                    reviews.map((r) => <ReviewList key={r._id} review={r} onAfterChange={refetchList} />)
                )}
            </div>

            {/* Load more */}
            {hasNextPage && (
                <div className='p-5 text-center border-t border-[#C9A24B]/15'>
                    <button type='button' onClick={() => fetchNextPage()} disabled={isFetching}
                            className='btn-dark-gold uppercase text-[10px] tracking-[0.25em] font-semibold px-8 py-3 cursor-pointer disabled:opacity-50'>
                        {isFetching ? 'Loading…' : 'Load more reviews'}
                    </button>
                </div>
            )}

            <WriteDialog
                open={writeOpen}
                onOpenChange={setWriteOpen}
                productId={productId}
                existing={existingReview}
                onSaved={handleSaved}
            />
        </div>
    )
}

export default ProductReveiw
