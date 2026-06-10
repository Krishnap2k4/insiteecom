'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { WEBSITE_ORDER_DETAILS, WEBSITE_RETURN_DETAILS, WEBSITE_RETURNS } from '@/routes/WebsiteRoute'
import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useRequireAuth from '@/hooks/useRequireAuth'
import Link from 'next/link'
import { FiInfo } from 'react-icons/fi'

const breadCrumb = { title: 'Request return', links: [{ label: 'Returns', href: WEBSITE_RETURNS }, { label: 'New request' }] }

/**
 * Customer requests a return or exchange against one of their orders.
 *
 * The form only lists items that still have returnable balance — i.e.
 * the qty NOT already in an active return. If the customer already
 * returned everything we never let them land here in the first place,
 * but we still render a clear "nothing left to return" empty state.
 */
const ReturnRequestPage = ({ params }) => {
    const { isLoggedIn, rehydrated } = useRequireAuth()
    const { orderid } = use(params)
    const router = useRouter()

    const [order, setOrder] = useState(null)
    if (!rehydrated || !isLoggedIn) return null
    const [returnable, setReturnable] = useState(null)
    const [activeReturns, setActiveReturns] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [type, setType] = useState('return')
    const [requestNote, setRequestNote] = useState('')
    const [picks, setPicks] = useState({}) // { sku: { qty, reason } }

    useEffect(() => {
        const load = async () => {
            try {
                const { data: res } = await axios.get(`/api/orders/get/${orderid}`)
                if (res?.success && res.data?.order) {
                    setOrder(res.data.order)
                    setReturnable(res.data.returnable || null)
                    setActiveReturns(res.data.returnable?.activeReturns || [])
                } else {
                    showToast('error', res?.message || 'Order not found.')
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [orderid])

    /**
     * Items the customer can actually pick from — only those with
     * available > 0. We still need the original order.items for the
     * name + option snapshot rendering, so we join on sku.
     */
    const selectableItems = useMemo(() => {
        if (!order?.items?.length || !returnable?.bySku) return []
        return order.items
            .map((it) => {
                const sku = String(it.sku || '').trim()
                const info = returnable.bySku[sku]
                if (!info || info.available <= 0) return null
                return { ...it, available: info.available, ordered: info.ordered, inActive: info.inActiveReturns }
            })
            .filter(Boolean)
    }, [order, returnable])

    const togglePick = (sku, name, available) => {
        setPicks((prev) => {
            if (prev[sku]) {
                const next = { ...prev }
                delete next[sku]
                return next
            }
            return { ...prev, [sku]: { qty: 1, reason: '', name, max: available } }
        })
    }
    const setPickQty = (sku, qty) => setPicks((prev) => ({ ...prev, [sku]: { ...prev[sku], qty } }))
    const setPickReason = (sku, reason) => setPicks((prev) => ({ ...prev, [sku]: { ...prev[sku], reason } }))

    const submit = async () => {
        const items = Object.entries(picks).map(([sku, { qty, reason, name }]) => ({
            sku, name, qty: Number(qty) || 1, reason,
        }))
        if (items.length === 0) return showToast('error', 'Pick at least one item.')

        setSubmitting(true)
        try {
            const { data: res } = await axios.post('/api/account/returns', {
                orderId: order._id,
                type,
                items,
                requestNote,
            })
            if (!res?.success) throw new Error(res?.message || 'Could not submit request.')
            showToast('success', res.message)
            router.push(WEBSITE_RETURN_DETAILS(res.data.returnNumber))
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded p-10 text-center text-white/50'>Loading…</div>
                </UserPanelLayout>
            </div>
        )
    }

    if (!order) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded p-10 text-center text-red-400 font-semibold'>Order not found.</div>
                </UserPanelLayout>
            </div>
        )
    }

    if (order.fulfillmentStatus !== 'fulfilled') {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded p-6 text-center'>
                        <p className='text-white/60'>You can request a return only after an order is delivered.</p>
                        <Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)} className='btn-dark-gold inline-block mt-4 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                            Back to order
                        </Link>
                    </div>
                </UserPanelLayout>
            </div>
        )
    }

    // Nothing left to return → either all items are already in active
    // returns, or the order has been fully refunded.
    if (selectableItems.length === 0) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded p-6 text-center space-y-3'>
                        <p className='text-white font-medium'>No items left to return.</p>
                        <p className='text-sm text-white/50'>
                            {activeReturns.length > 0
                                ? 'All eligible items already have an active return request. Check the Returns section.'
                                : 'This order has already been fully refunded.'}
                        </p>
                        <div className='flex justify-center gap-2 mt-4'>
                            <Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)} className='btn-outline-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                                Back to order
                            </Link>
                            <Link href={WEBSITE_RETURNS} className='btn-dark-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                                View my returns
                            </Link>
                        </div>
                    </div>
                </UserPanelLayout>
            </div>
        )
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <UserPanelLayout>
                <div className='space-y-6'>
                    <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded p-5'>
                        <h1 className='text-xl font-serif-display text-[#F0D77C]'>Request return or exchange</h1>
                        <p className='text-sm text-white/50 mt-1'>For order <Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)} className='text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors'>{order.orderNumber}</Link></p>
                    </div>

                    {activeReturns.length > 0 && (
                        <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3'>
                            <FiInfo className='mt-0.5 shrink-0 text-amber-500' />
                            <div className='min-w-0'>
                                <p className='text-sm font-medium text-amber-400'>You already have a return in progress for some items.</p>
                                <p className='text-xs text-amber-500 mt-1'>You can request a new return for the remaining items below. Active requests:</p>
                                <ul className='mt-1 text-xs text-amber-500/80 space-y-0.5'>
                                    {activeReturns.map((r) => (
                                        <li key={r._id}>
                                            <Link href={WEBSITE_RETURN_DETAILS(r.returnNumber)} className='underline hover:text-amber-400 transition-colors'>{r.returnNumber}</Link> — {r.type}, {String(r.status).replace('_', ' ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded p-5 space-y-4'>
                        <div>
                            <Label className='block mb-2 text-sm font-medium text-white/80'>What do you want?</Label>
                            <div className='flex gap-3 flex-wrap'>
                                {[
                                    { key: 'return', label: 'Refund', sub: 'Send the item back and get your money back' },
                                    { key: 'exchange', label: 'Exchange', sub: 'Swap for a different size, color or variant' },
                                ].map((opt) => {
                                    const active = type === opt.key
                                    return (
                                        <label
                                            key={opt.key}
                                            className={`flex-1 min-w-[200px] p-3 border rounded-md cursor-pointer transition-all ${active ? 'border-[#C9A24B] ring-1 ring-[#C9A24B] bg-[#C9A24B]/5' : 'border-[#C9A24B]/20 hover:border-[#C9A24B]/50 bg-white/5'}`}
                                        >
                                            <div className='flex items-start gap-3'>
                                                <input type='radio' name='return-type' value={opt.key} checked={active} onChange={() => setType(opt.key)} className='mt-1 accent-[#C9A24B]' />
                                                <div>
                                                    <p className={`font-medium text-sm ${active ? 'text-[#F0D77C]' : 'text-white'}`}>{opt.label}</p>
                                                    <p className='text-xs text-white/50'>{opt.sub}</p>
                                                </div>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <Label className='block mb-2 text-sm font-medium text-white/80'>Pick the items</Label>
                            <div className='space-y-3'>
                                {selectableItems.map((it) => {
                                    const selected = Boolean(picks[it.sku])
                                    return (
                                        <div key={it.sku || it.name} className={`p-3 border rounded-md transition-all ${selected ? 'border-[#C9A24B] bg-[#C9A24B]/5' : 'border-[#C9A24B]/20 bg-white/5'}`}>
                                            <label className='flex items-start gap-3 cursor-pointer'>
                                                <input
                                                    type='checkbox'
                                                    checked={selected}
                                                    onChange={() => togglePick(it.sku, it.name, it.available)}
                                                    className='mt-1 accent-[#C9A24B]'
                                                />
                                                <div className='flex-1 min-w-0'>
                                                    <p className={`text-sm font-medium ${selected ? 'text-[#F0D77C]' : 'text-white'}`}>{it.name}</p>
                                                    {(it.optionValuesSnapshot || []).length > 0 && (
                                                        <p className='text-xs text-white/60'>
                                                            {it.optionValuesSnapshot.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                        </p>
                                                    )}
                                                    <p className='text-xs text-white/40'>
                                                        SKU: {it.sku} · Ordered {it.ordered}
                                                        {it.inActive > 0 && <span className='ml-1 text-amber-500'>· {it.inActive} already in return</span>}
                                                        <span className='ml-1'>· Available to return: <strong className='text-white/80'>{it.available}</strong></span>
                                                    </p>
                                                </div>
                                            </label>
                                            {selected && (
                                                <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pl-7'>
                                                    <div>
                                                        <Label className='text-xs block mb-1 text-white/50'>Qty to return (max {it.available})</Label>
                                                        <Input
                                                            type='number'
                                                            min={1}
                                                            max={it.available}
                                                            value={picks[it.sku].qty}
                                                            onChange={(e) => setPickQty(it.sku, Math.min(it.available, Math.max(1, Number(e.target.value) || 1)))}
                                                            className='bg-[#0a0805] border-[#C9A24B]/30 text-white placeholder:text-white/30 focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]'
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className='text-xs block mb-1 text-white/50'>Reason</Label>
                                                        <Input
                                                            value={picks[it.sku].reason}
                                                            onChange={(e) => setPickReason(it.sku, e.target.value)}
                                                            placeholder='e.g. Wrong size'
                                                            className='bg-[#0a0805] border-[#C9A24B]/30 text-white placeholder:text-white/30 focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]'
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <Label className='block mb-2 text-sm font-medium text-white/80'>Anything else?</Label>
                            <Textarea
                                value={requestNote}
                                onChange={(e) => setRequestNote(e.target.value)}
                                placeholder={type === 'exchange' ? 'Tell us which size/color you want instead.' : 'Optional note for our team'}
                                className='bg-white/5 border-[#C9A24B]/30 text-white placeholder:text-white/30 focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]'
                            />
                        </div>

                        <div className='flex justify-end gap-2 pt-2'>
                            <Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)} className='btn-outline-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                                Cancel
                            </Link>
                            <ButtonLoading
                                type='button'
                                text='Submit request'
                                loading={submitting}
                                disabled={Object.keys(picks).length === 0}
                                onClick={submit}
                                className='btn-dark-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'
                            />
                        </div>
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default ReturnRequestPage
