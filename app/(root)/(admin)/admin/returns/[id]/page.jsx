'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import {
    ADMIN_DASHBOARD,
    ADMIN_ORDER_DETAILS,
    ADMIN_RETURN_SHOW,
} from '@/routes/AdminPanelRoute'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_RETURN_SHOW, label: 'Returns' },
    { href: '', label: 'Details' },
]

const titleCase = (s = '') => s.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')

const StatusPill = ({ status }) => {
    const palette = {
        requested: 'bg-amber-100 text-amber-700',
        approved: 'bg-sky-100 text-sky-700',
        received: 'bg-indigo-100 text-indigo-700',
        refunded: 'bg-emerald-100 text-emerald-700',
        replaced: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-600',
    }
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${palette[status] || 'bg-gray-100 text-gray-600'}`}>
            {String(status || '—').replace('_', ' ')}
        </span>
    )
}

const ReturnDetail = ({ params }) => {
    const { id } = use(params)

    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    const [decisionOpen, setDecisionOpen] = useState(null) // 'approve' | 'reject'
    const [adminNote, setAdminNote] = useState('')

    const [refundOpen, setRefundOpen] = useState(false)
    const [refundAmount, setRefundAmount] = useState('')
    const [refundReason, setRefundReason] = useState('')

    const [shipOpen, setShipOpen] = useState(false)
    const [shipCarrier, setShipCarrier] = useState('')
    const [shipTracking, setShipTracking] = useState('')
    const [shipUrl, setShipUrl] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const { data: res } = await axios.get(`/api/admin/returns/${id}`)
            if (res?.success) setDoc(res.data); else setDoc(null)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

    const decide = async (action) => {
        setBusy(true)
        try {
            const { data: res } = await axios.put(`/api/admin/returns/${doc._id}`, { action, adminNote })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            setDecisionOpen(null)
            setAdminNote('')
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const markReceived = async () => {
        if (!confirm('Mark the returned items as received?')) return
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/admin/returns/${doc._id}/mark-received`)
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const issueRefund = async () => {
        const amt = Number(refundAmount)
        if (!(amt > 0)) return showToast('error', 'Enter a refund amount.')
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/admin/returns/${doc._id}/refund`, { amount: amt, reason: refundReason })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            setRefundOpen(false); setRefundAmount(''); setRefundReason('')
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const createReplacement = async () => {
        if (!shipCarrier && !shipTracking) return showToast('error', 'Enter a carrier or tracking number.')
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/admin/returns/${doc._id}/replacement`, {
                carrier: shipCarrier, trackingNumber: shipTracking, trackingUrl: shipUrl,
            })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            setShipOpen(false); setShipCarrier(''); setShipTracking(''); setShipUrl('')
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    if (loading) return <div><BreadCrumb breadcrumbData={breadcrumbData} /><div className='border rounded p-10 text-center text-gray-500'>Loading…</div></div>
    if (!doc) return <div><BreadCrumb breadcrumbData={breadcrumbData} /><div className='border rounded p-10 text-center text-red-500 font-semibold'>Return not found.</div></div>

    const isRequested = doc.status === 'requested'
    const isApproved = doc.status === 'approved'
    const isReceived = doc.status === 'received'

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <div className='flex flex-wrap items-start justify-between gap-3 mb-5'>
                <div>
                    <h1 className='text-2xl font-semibold'>{doc.returnNumber}</h1>
                    <p className='text-sm text-gray-500 mt-1 capitalize'>
                        {doc.type} request · {new Date(doc.createdAt).toLocaleString('en-IN')}
                    </p>
                    {doc.order?.orderNumber && (
                        <p className='text-sm text-gray-500'>
                            For order <Link href={ADMIN_ORDER_DETAILS(doc.order.orderNumber)} className='text-primary hover:underline'>{doc.order.orderNumber}</Link>
                        </p>
                    )}
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
                    <StatusPill status={doc.status} />
                    {isRequested && (
                        <>
                            <Button type='button' variant='outline' onClick={() => { setDecisionOpen('reject'); setAdminNote('') }}>Reject</Button>
                            <Button type='button' onClick={() => { setDecisionOpen('approve'); setAdminNote('') }}>Approve</Button>
                        </>
                    )}
                    {isApproved && <Button type='button' onClick={markReceived} disabled={busy}>Mark items received</Button>}
                    {isReceived && doc.type === 'return' && <Button type='button' onClick={() => { setRefundOpen(true); setRefundAmount('') }}>Issue refund</Button>}
                    {isReceived && doc.type === 'exchange' && <Button type='button' onClick={() => setShipOpen(true)}>Create replacement shipment</Button>}
                </div>
            </div>

            <div className='grid lg:grid-cols-[2fr_1fr] gap-5'>
                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'><h4 className='font-semibold'>Items</h4></CardHeader>
                        <CardContent className='p-3'>
                            <table className='w-full text-sm'>
                                <thead className='text-xs text-gray-500'>
                                    <tr><th className='text-start py-1.5'>Item</th><th className='text-start py-1.5'>SKU</th><th className='text-start py-1.5'>Qty</th><th className='text-start py-1.5'>Reason</th></tr>
                                </thead>
                                <tbody>
                                    {doc.items?.map((it, idx) => (
                                        <tr key={idx} className='border-t'>
                                            <td className='py-1.5'>{it.name || '—'}</td>
                                            <td className='py-1.5 text-gray-500'>{it.sku}</td>
                                            <td className='py-1.5'>{it.qty}</td>
                                            <td className='py-1.5 text-gray-500'>{it.reason || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {doc.requestNote && <p className='mt-3 text-sm'><strong>Customer note:</strong> {doc.requestNote}</p>}
                            {doc.adminNote && <p className='mt-3 text-sm'><strong>Your note:</strong> {doc.adminNote}</p>}
                        </CardContent>
                    </Card>
                </div>

                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'><h4 className='font-semibold'>Customer</h4></CardHeader>
                        <CardContent className='p-3 text-sm'>
                            <p className='font-medium'>{doc.user?.name || doc.order?.shippingAddress?.fullName || '—'}</p>
                            <p className='text-gray-500'>{doc.user?.email || doc.order?.email}</p>
                            <hr className='my-3' />
                            <p className='text-xs text-gray-500 mb-1'>Original shipping address</p>
                            <p>{doc.order?.shippingAddress?.fullName}</p>
                            <p className='text-gray-600'>{[doc.order?.shippingAddress?.line1, doc.order?.shippingAddress?.line2, doc.order?.shippingAddress?.landmark].filter(Boolean).join(', ')}</p>
                            <p className='text-gray-600'>{doc.order?.shippingAddress?.city}, {doc.order?.shippingAddress?.state} {doc.order?.shippingAddress?.pincode}</p>
                            <p className='text-gray-600'>{doc.order?.shippingAddress?.country}</p>
                            <p className='text-gray-500 mt-1'>{doc.order?.shippingAddress?.phone}</p>
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'><h4 className='font-semibold'>Timestamps</h4></CardHeader>
                        <CardContent className='p-3 text-sm space-y-1.5'>
                            <p><span className='text-gray-500'>Requested:</span> {new Date(doc.createdAt).toLocaleString('en-IN')}</p>
                            {doc.approvedAt && <p><span className='text-gray-500'>Approved:</span> {new Date(doc.approvedAt).toLocaleString('en-IN')}</p>}
                            {doc.receivedAt && <p><span className='text-gray-500'>Received:</span> {new Date(doc.receivedAt).toLocaleString('en-IN')}</p>}
                            {doc.completedAt && <p><span className='text-gray-500'>Completed:</span> {new Date(doc.completedAt).toLocaleString('en-IN')}</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={decisionOpen !== null} onOpenChange={(open) => !open && setDecisionOpen(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{decisionOpen === 'approve' ? 'Approve request' : 'Reject request'}</DialogTitle>
                        <DialogDescription>
                            {decisionOpen === 'approve' ? 'Approving sends pickup / ship-back instructions to the customer.' : 'Rejecting tells the customer the reason below.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label className='mb-1.5 block'>Note to customer{decisionOpen === 'reject' ? ' (recommended)' : ''}</Label>
                        <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setDecisionOpen(null)}>Cancel</Button>
                        <ButtonLoading
                            type='button'
                            text={decisionOpen === 'approve' ? 'Approve' : 'Reject'}
                            loading={busy}
                            onClick={() => decide(decisionOpen)}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Issue refund</DialogTitle></DialogHeader>
                    <div className='space-y-3'>
                        <div><Label className='mb-1.5 block'>Amount</Label><Input type='number' value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} /></div>
                        <div><Label className='mb-1.5 block'>Reason</Label><Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setRefundOpen(false)}>Cancel</Button>
                        <ButtonLoading type='button' text='Issue refund' loading={busy} onClick={issueRefund} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={shipOpen} onOpenChange={setShipOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create replacement shipment</DialogTitle></DialogHeader>
                    <div className='space-y-3'>
                        <div><Label className='mb-1.5 block'>Carrier</Label><Input value={shipCarrier} onChange={(e) => setShipCarrier(e.target.value)} /></div>
                        <div><Label className='mb-1.5 block'>Tracking number</Label><Input value={shipTracking} onChange={(e) => setShipTracking(e.target.value)} /></div>
                        <div><Label className='mb-1.5 block'>Tracking URL</Label><Input value={shipUrl} onChange={(e) => setShipUrl(e.target.value)} placeholder='https://…' /></div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setShipOpen(false)}>Cancel</Button>
                        <ButtonLoading type='button' text='Create shipment' loading={busy} onClick={createReplacement} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ReturnDetail
