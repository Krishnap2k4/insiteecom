'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { IoStar, IoStarOutline } from 'react-icons/io5'
import { FiCheckCircle } from 'react-icons/fi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import ButtonLoading from '../ButtonLoading'
import ReviewList from './ReviewList'
import ImageUploader from './ImageUploader'
import useFetch from '@/hooks/useFetch'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'

const Stars = ({ value, size = 14 }) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    return (
        <span className='inline-flex items-center'>
            {Array.from({ length: 5 }).map((_, i) => i < n
                ? <IoStar key={i} className='text-yellow-500' size={size} />
                : <IoStarOutline key={i} className='text-gray-300' size={size} />)}
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
                className='p-1 hover:scale-110 transition'
            >
                {v <= value
                    ? <IoStar className='text-yellow-500' size={24} />
                    : <IoStarOutline className='text-gray-300' size={24} />}
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
            <DialogContent className='max-w-lg'>
                <DialogHeader>
                    <DialogTitle>{existing ? 'Edit your review' : 'Write a review'}</DialogTitle>
                    <DialogDescription>
                        Your review goes through moderation before it appears for other shoppers.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    <div>
                        <Label className='mb-1.5 block'>Rating <span className='text-red-500'>*</span></Label>
                        <RatingInput value={rating} onChange={setRating} />
                    </div>
                    <div>
                        <Label className='mb-1.5 block'>Title <span className='text-red-500'>*</span></Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Summarise your experience' />
                    </div>
                    <div>
                        <Label className='mb-1.5 block'>Your review <span className='text-red-500'>*</span></Label>
                        <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder='What did you like or dislike?' />
                    </div>
                    <div>
                        <Label className='mb-1.5 block'>Photos (optional)</Label>
                        <ImageUploader
                            value={mediaUrls}
                            onChange={setMediaUrls}
                            max={5}
                            label='Upload photos'
                            helpText='Up to 5 photos. JPG, PNG, or WebP — 8 MB each.'
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
                    <ButtonLoading type='button' text={existing ? 'Save changes' : 'Submit review'} loading={submitting} onClick={submit} />
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
        // Also force the summary endpoint to re-fetch (useFetch caches by URL).
        // Simplest is a hard reload of just this hook — bump a key by re-mount.
    }

    return (
        <div className='mt-10 border rounded shadow-sm'>
            <div className='p-5 border-b'>
                <h3 className='text-xl font-semibold'>Reviews</h3>
            </div>

            <div className='p-5 grid lg:grid-cols-[1fr_2fr] gap-6 border-b'>
                <div>
                    <div className='flex items-baseline gap-3'>
                        <span className='text-5xl font-semibold'>{summary.averageRating}</span>
                        <Stars value={summary.averageRating} size={18} />
                    </div>
                    <p className='text-sm text-gray-500 mt-1'>
                        {summary.totalReview} review{summary.totalReview === 1 ? '' : 's'}
                    </p>
                    {summary.verifiedCount > 0 && (
                        <p className='text-xs text-emerald-700 mt-1 inline-flex items-center gap-1'>
                            <FiCheckCircle size={11} /> {summary.verifiedCount} verified buyer{summary.verifiedCount === 1 ? '' : 's'}
                        </p>
                    )}

                    <div className='mt-4'>
                        {authed === false ? (
                            <Button asChild className='w-full'>
                                <Link href={WEBSITE_LOGIN}>Log in to write a review</Link>
                            </Button>
                        ) : existingReview ? (
                            <Button type='button' className='w-full' onClick={() => setWriteOpen(true)}>
                                Edit your review
                            </Button>
                        ) : (
                            <Button type='button' className='w-full' onClick={() => setWriteOpen(true)}>
                                Write a review
                            </Button>
                        )}
                        {existingReview && existingReview.status === 'pending' && (
                            <p className='text-xs text-amber-700 mt-2 text-center'>Your review is awaiting moderation.</p>
                        )}
                        {existingReview && existingReview.status === 'rejected' && (
                            <p className='text-xs text-red-700 mt-2 text-center'>Your review was not approved. You can edit and resubmit.</p>
                        )}
                        {authed && !existingReview && verified && (
                            <p className='text-xs text-emerald-700 mt-2 text-center inline-flex items-center gap-1 w-full justify-center'>
                                <FiCheckCircle size={11} /> You bought this — your review will be marked verified.
                            </p>
                        )}
                    </div>
                </div>

                <div className='space-y-1.5'>
                    {[5, 4, 3, 2, 1].map((star) => {
                        const pct = Number(summary.percentage?.[star] || 0)
                        const count = Number(summary.rating?.[star] || 0)
                        return (
                            <div key={star} className='flex items-center gap-3'>
                                <span className='text-xs text-gray-500 w-8'>{star} star</span>
                                <Progress value={pct} className='h-2 flex-1' />
                                <span className='text-xs text-gray-500 w-10 text-right'>{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className='px-5 py-3 flex items-center justify-between border-b bg-gray-50'>
                <p className='text-sm text-gray-500'>
                    {reviews.length === 0 && summary.totalReview === 0
                        ? 'Be the first to review this product.'
                        : `Showing ${reviews.length} of ${summary.totalReview}`}
                </p>
                <div className='flex items-center gap-2'>
                    <label className='text-xs text-gray-500'>Sort:</label>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className='text-sm border rounded px-2 py-1 bg-white'
                    >
                        {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                </div>
            </div>

            <div className='px-5'>
                {reviews.length === 0 ? (
                    <p className='py-10 text-center text-sm text-gray-500'>No reviews yet.</p>
                ) : (
                    reviews.map((r) => <ReviewList key={r._id} review={r} onAfterChange={refetchList} />)
                )}
            </div>

            {hasNextPage && (
                <div className='p-4 text-center border-t'>
                    <Button type='button' variant='outline' onClick={() => fetchNextPage()} disabled={isFetching}>
                        {isFetching ? 'Loading…' : 'Load more reviews'}
                    </Button>
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
