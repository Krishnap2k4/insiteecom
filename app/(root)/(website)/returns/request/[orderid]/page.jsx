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
    const { orderid } = use(params)
    const router = useRouter()

    const [order, setOrder] = useState(null)
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
                    <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
                </UserPanelLayout>
            </div>
        )
    }

    if (!order) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border rounded p-10 text-center text-red-500 font-semibold'>Order not found.</div>
                </UserPanelLayout>
            </div>
        )
    }

    if (order.fulfillmentStatus !== 'fulfilled') {
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumb} />
                <UserPanelLayout>
                    <div className='border rounded p-6 text-center'>
                        <p className='text-gray-600'>You can request a return only after an order is delivered.</p>
                        <Button asChild className='mt-3'><Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)}>Back to order</Link></Button>
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
                    <div className='border rounded p-6 text-center space-y-3'>
                        <p className='text-gray-700 font-medium'>No items left to return.</p>
                        <p className='text-sm text-gray-500'>
                            {activeReturns.length > 0
                                ? 'All eligible items already have an active return request. Check the Returns section.'
                                : 'This order has already been fully refunded.'}
                        </p>
                        <div className='flex justify-center gap-2'>
                            <Button asChild variant='outline'><Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)}>Back to order</Link></Button>
                            <Button asChild><Link href={WEBSITE_RETURNS}>View my returns</Link></Button>
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
                    <div className='border rounded p-5'>
                        <h1 className='text-xl font-semibold'>Request return or exchange</h1>
                        <p className='text-sm text-gray-500 mt-1'>For order <Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)} className='text-primary hover:underline'>{order.orderNumber}</Link></p>
                    </div>

                    {activeReturns.length > 0 && (
                        <div className='rounded-md border border-amber-200 bg-amber-50 p-4 flex items-start gap-3'>
                            <FiInfo className='mt-0.5 shrink-0 text-amber-700' />
                            <div className='min-w-0'>
                                <p className='text-sm font-medium text-amber-900'>You already have a return in progress for some items.</p>
                                <p className='text-xs text-amber-800 mt-1'>You can request a new return for the remaining items below. Active requests:</p>
                                <ul className='mt-1 text-xs text-amber-800 space-y-0.5'>
                                    {activeReturns.map((r) => (
                                        <li key={r._id}>
                                            <Link href={WEBSITE_RETURN_DETAILS(r.returnNumber)} className='underline'>{r.returnNumber}</Link> — {r.type}, {String(r.status).replace('_', ' ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className='border rounded p-5 space-y-4'>
                        <div>
                            <Label className='block mb-2 text-sm font-medium'>What do you want?</Label>
                            <div className='flex gap-3 flex-wrap'>
                                {[
                                    { key: 'return', label: 'Refund', sub: 'Send the item back and get your money back' },
                                    { key: 'exchange', label: 'Exchange', sub: 'Swap for a different size, color or variant' },
                                ].map((opt) => {
                                    const active = type === opt.key
                                    return (
                                        <label
                                            key={opt.key}
                                            className={`flex-1 min-w-[200px] p-3 border rounded-md cursor-pointer transition ${active ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-gray-400'}`}
                                        >
                                            <div className='flex items-start gap-3'>
                                                <input type='radio' name='return-type' value={opt.key} checked={active} onChange={() => setType(opt.key)} className='mt-1 accent-primary' />
                                                <div>
                                                    <p className='font-medium text-sm'>{opt.label}</p>
                                                    <p className='text-xs text-gray-500'>{opt.sub}</p>
                                                </div>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <Label className='block mb-2 text-sm font-medium'>Pick the items</Label>
                            <div className='space-y-3'>
                                {selectableItems.map((it) => {
                                    const selected = Boolean(picks[it.sku])
                                    return (
                                        <div key={it.sku || it.name} className={`p-3 border rounded-md transition ${selected ? 'border-primary bg-primary/5' : ''}`}>
                                            <label className='flex items-start gap-3 cursor-pointer'>
                                                <input
                                                    type='checkbox'
                                                    checked={selected}
                                                    onChange={() => togglePick(it.sku, it.name, it.available)}
                                                    className='mt-1 accent-primary'
                                                />
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-medium'>{it.name}</p>
                                                    {(it.optionValuesSnapshot || []).length > 0 && (
                                                        <p className='text-xs text-gray-500'>
                                                            {it.optionValuesSnapshot.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                        </p>
                                                    )}
                                                    <p className='text-xs text-gray-400'>
                                                        SKU: {it.sku} · Ordered {it.ordered}
                                                        {it.inActive > 0 && <span className='ml-1 text-amber-700'>· {it.inActive} already in return</span>}
                                                        <span className='ml-1'>· Available to return: <strong>{it.available}</strong></span>
                                                    </p>
                                                </div>
                                            </label>
                                            {selected && (
                                                <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pl-7'>
                                                    <div>
                                                        <Label className='text-xs block mb-1 text-gray-500'>Qty to return (max {it.available})</Label>
                                                        <Input
                                                            type='number'
                                                            min={1}
                                                            max={it.available}
                                                            value={picks[it.sku].qty}
                                                            onChange={(e) => setPickQty(it.sku, Math.min(it.available, Math.max(1, Number(e.target.value) || 1)))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className='text-xs block mb-1 text-gray-500'>Reason</Label>
                                                        <Input
                                                            value={picks[it.sku].reason}
                                                            onChange={(e) => setPickReason(it.sku, e.target.value)}
                                                            placeholder='e.g. Wrong size'
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
                            <Label className='block mb-2 text-sm font-medium'>Anything else?</Label>
                            <Textarea
                                value={requestNote}
                                onChange={(e) => setRequestNote(e.target.value)}
                                placeholder={type === 'exchange' ? 'Tell us which size/color you want instead.' : 'Optional note for our team'}
                            />
                        </div>

                        <div className='flex justify-end gap-2'>
                            <Button asChild variant='outline'>
                                <Link href={WEBSITE_ORDER_DETAILS(order.orderNumber)}>Cancel</Link>
                            </Button>
                            <ButtonLoading
                                type='button'
                                text='Submit request'
                                loading={submitting}
                                disabled={Object.keys(picks).length === 0}
                                onClick={submit}
                            />
                        </div>
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default ReturnRequestPage
