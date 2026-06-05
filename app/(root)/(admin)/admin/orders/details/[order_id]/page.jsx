'use client'
import Image from 'next/image'
import Link from 'next/link'
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import { use, useEffect, useState } from 'react'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { ADMIN_DASHBOARD, ADMIN_ORDER_SHOW } from '@/routes/AdminPanelRoute'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import Select from '@/components/Application/Select'
import { paymentStatus, fulfillmentStatus } from '@/lib/utils'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FiDollarSign, FiDownload, FiPackage, FiRefreshCw, FiTruck, FiUser } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_ORDER_SHOW, label: 'Orders' },
    { href: '', label: 'Order Details' },
]

const titleCase = (s = '') => s.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')

const formatINR = (v, cur = 'INR') =>
    Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: cur })

const OrderDetails = ({ params }) => {
    const { order_id } = use(params)

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    const [paymentStatusValue, setPaymentStatusValue] = useState('pending')
    const [fulfillmentStatusValue, setFulfillmentStatusValue] = useState('unfulfilled')
    const [statusNote, setStatusNote] = useState('')

    const [refundOpen, setRefundOpen] = useState(false)
    const [refundAmount, setRefundAmount] = useState('')
    const [refundReason, setRefundReason] = useState('')

    const [shipmentOpen, setShipmentOpen] = useState(false)
    const [shipmentCarrier, setShipmentCarrier] = useState('')
    const [shipmentTracking, setShipmentTracking] = useState('')
    const [shipmentUrl, setShipmentUrl] = useState('')

    const reload = async () => {
        setLoading(true)
        try {
            const { data: res } = await axios.get(`/api/orders/get/${order_id}`)
            if (res?.success) {
                setData(res.data)
                setPaymentStatusValue(res.data.order.paymentStatus || 'pending')
                setFulfillmentStatusValue(res.data.order.fulfillmentStatus || 'unfulfilled')
            } else {
                setData(null)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { reload() /* eslint-disable-next-line */ }, [order_id])

    const saveStatus = async () => {
        setBusy(true)
        try {
            const { data: res } = await axios.put('/api/orders/update-status', {
                _id: data.order._id,
                paymentStatus: paymentStatusValue,
                fulfillmentStatus: fulfillmentStatusValue,
                note: statusNote,
            })
            if (!res?.success) throw new Error(res?.message || 'Update failed.')
            showToast('success', res.message)
            setStatusNote('')
            await reload()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const handleRefund = async () => {
        const amt = Number(refundAmount)
        if (!(amt > 0)) return showToast('error', 'Enter a refund amount.')
        setBusy(true)
        try {
            const { data: res } = await axios.post('/api/orders/refund', {
                orderId: data.order._id,
                amount: amt,
                reason: refundReason,
            })
            if (!res?.success) throw new Error(res?.message || 'Refund failed.')
            showToast('success', res.message)
            setRefundOpen(false)
            setRefundAmount('')
            setRefundReason('')
            await reload()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const handleMarkCodPaid = async () => {
        if (!confirm('Mark cash as collected for this COD order?')) return
        setBusy(true)
        try {
            const { data: res } = await axios.post('/api/orders/mark-cod-paid', {
                orderId: data.order._id,
            })
            if (!res?.success) throw new Error(res?.message || 'Could not mark as paid.')
            showToast('success', res.message)
            await reload()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const handleShipment = async () => {
        if (!shipmentCarrier && !shipmentTracking) {
            return showToast('error', 'Enter a carrier or tracking number.')
        }
        setBusy(true)
        try {
            const items = (data.order.items || []).map((it) => ({ sku: it.sku || 'NA', qty: it.qty }))
            const { data: res } = await axios.post('/api/orders/shipment', {
                orderId: data.order._id,
                items,
                carrier: shipmentCarrier,
                trackingNumber: shipmentTracking,
                trackingUrl: shipmentUrl,
            })
            if (!res?.success) throw new Error(res?.message || 'Shipment failed.')
            showToast('success', res.message)
            setShipmentOpen(false)
            setShipmentCarrier(''); setShipmentTracking(''); setShipmentUrl('')
            await reload()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const updateShipmentStatus = async (shipmentId, status) => {
        setBusy(true)
        try {
            const { data: res } = await axios.put('/api/orders/shipment', { _id: shipmentId, status })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            await reload()
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

    if (!data?.order) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-red-500 font-semibold'>Order not found.</div>
            </div>
        )
    }

    const { order, payments = [], refunds = [], shipments = [], statusHistory = [], invoice = null } = data
    const invoiceAvailable = Boolean(invoice?.invoiceNumber)
    const orderRef = order.orderNumber || order._id
    const shippingAddress = order.shippingAddress?.line1
        ? order.shippingAddress
        : { fullName: order.name, phone: order.phone, line1: '', landmark: order.landmark, city: order.city, state: order.state, country: order.country, pincode: order.pincode }
    const customerNote = order.customerNote || order.ordernote || ''
    const refundedSoFar = refunds.filter((r) => r.status === 'processed').reduce((s, r) => s + (r.amount || 0), 0)
    const refundableMax = Math.max(0, order.totalAmount - refundedSoFar)

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <div className='flex flex-wrap items-start justify-between gap-3 mb-5'>
                <div>
                    <h1 className='text-2xl font-semibold'>Order {order.orderNumber || order.order_id}</h1>
                    <p className='text-sm text-gray-500 mt-1'>
                        Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                    {invoiceAvailable && (
                        <Button type='button' variant='outline' asChild>
                            <a href={`/api/invoice/${orderRef}/download`} target='_blank' rel='noopener'>
                                <FiDownload className='mr-1' /> Invoice
                            </a>
                        </Button>
                    )}
                    {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && order.fulfillmentStatus !== 'cancelled' && (
                        <Button type='button' variant='outline' onClick={handleMarkCodPaid} disabled={busy}>
                            <FiDollarSign className='mr-1' /> Mark cash collected
                        </Button>
                    )}
                    {/* Refund only makes sense once we have money in
                        hand. An unpaid order has nothing to refund. */}
                    {(order.paymentStatus === 'paid' || order.paymentStatus === 'partially_refunded') && refundableMax > 0 && (
                        <Button type='button' variant='outline' onClick={() => {
                            setRefundAmount(String(refundableMax || ''))
                            setRefundOpen(true)
                        }}>
                            <FiRefreshCw className='mr-1' /> Refund
                        </Button>
                    )}
                    <Button type='button' onClick={() => setShipmentOpen(true)} disabled={order.fulfillmentStatus === 'cancelled' || order.fulfillmentStatus === 'fulfilled'}>
                        <FiTruck className='mr-1' /> Create shipment
                    </Button>
                </div>
            </div>

            <div className='grid lg:grid-cols-[2fr_1fr] gap-5'>
                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Items</h4>
                        </CardHeader>
                        <CardContent className='p-0'>
                            <table className='w-full'>
                                <tbody>
                                    {(order.items?.length ? order.items : (order.products || [])).map((it, idx) => (
                                        <tr key={idx} className='border-b last:border-b-0'>
                                            <td className='p-3'>
                                                <div className='flex items-center gap-3'>
                                                    <Image
                                                        src={it.image || it?.variantId?.media?.[0]?.secure_url || placeholderImg.src}
                                                        width={48} height={48}
                                                        alt={it.name || ''}
                                                        className='rounded border object-cover'
                                                    />
                                                    <div>
                                                        <p className='text-sm font-medium line-clamp-1'>
                                                            {it?.product?.slug ? (
                                                                <Link href={WEBSITE_PRODUCT_DETAILS(it.product.slug, it.product.publicId)}>{it.name || it?.product?.name}</Link>
                                                            ) : (it.name || it?.productId?.name || 'Item')}
                                                        </p>
                                                        {(it.optionValuesSnapshot || []).length > 0 && (
                                                            <p className='text-xs text-gray-500'>
                                                                {it.optionValuesSnapshot.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                            </p>
                                                        )}
                                                        {it.sku && <p className='text-xs text-gray-400'>SKU: {it.sku}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='p-3 text-right text-sm whitespace-nowrap'>
                                                {it.qty} × {formatINR(it.sellingPrice, order.currency || 'INR')}
                                                <p className='font-medium'>{formatINR(it.lineTotal || (it.qty * it.sellingPrice), order.currency || 'INR')}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Shipments</h4>
                        </CardHeader>
                        <CardContent className='p-3'>
                            {shipments.length === 0 ? (
                                <p className='text-sm text-gray-500'>No shipments created yet.</p>
                            ) : (
                                <div className='space-y-3'>
                                    {shipments.map((sh) => (
                                        <div key={sh._id} className='border rounded p-3 flex flex-wrap items-start justify-between gap-3'>
                                            <div className='min-w-0'>
                                                <p className='font-medium text-sm'>{sh.carrier || 'Carrier'} · {sh.trackingNumber || '—'}</p>
                                                <p className='text-xs text-gray-500 mt-0.5 capitalize'>{titleCase(sh.status)}</p>
                                                {sh.trackingUrl && (
                                                    <a href={sh.trackingUrl} target='_blank' rel='noopener noreferrer' className='text-xs text-primary hover:underline'>
                                                        Tracking link →
                                                    </a>
                                                )}
                                            </div>
                                            <div className='flex flex-wrap gap-2'>
                                                {['in_transit', 'out_for_delivery', 'delivered'].map((next) => (
                                                    <Button key={next} type='button' variant='outline' size='sm' disabled={busy || sh.status === next} onClick={() => updateShipmentStatus(sh._id, next)}>
                                                        Mark {titleCase(next)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Refunds</h4>
                        </CardHeader>
                        <CardContent className='p-3'>
                            {refunds.length === 0 ? (
                                <p className='text-sm text-gray-500'>No refunds issued.</p>
                            ) : (
                                <table className='w-full text-sm'>
                                    <thead className='text-xs text-gray-500'>
                                        <tr><th className='text-start py-1.5'>Amount</th><th className='text-start py-1.5'>Status</th><th className='text-start py-1.5'>Reason</th><th className='text-start py-1.5'>Issued</th></tr>
                                    </thead>
                                    <tbody>
                                        {refunds.map((r) => (
                                            <tr key={r._id} className='border-t'>
                                                <td className='py-1.5'>{formatINR(r.amount, order.currency || 'INR')}</td>
                                                <td className='py-1.5 capitalize'>{r.status}</td>
                                                <td className='py-1.5 text-gray-500'>{r.reason || '—'}</td>
                                                <td className='py-1.5 text-gray-500'>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Timeline</h4>
                        </CardHeader>
                        <CardContent className='p-3'>
                            {statusHistory.length === 0 ? (
                                <p className='text-sm text-gray-500'>No history yet.</p>
                            ) : (
                                <ol className='space-y-3 text-sm'>
                                    {statusHistory.map((h) => (
                                        <li key={h._id} className='flex gap-3'>
                                            <span className='w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0' />
                                            <div>
                                                <p className='capitalize'><strong>{h.statusType}</strong> → {titleCase(h.toStatus)}</p>
                                                {h.note && <p className='text-xs text-gray-500'>{h.note}</p>}
                                                <p className='text-xs text-gray-400'>{new Date(h.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold flex items-center gap-2'><FiUser /> Customer</h4>
                        </CardHeader>
                        <CardContent className='p-3 text-sm'>
                            <p className='font-medium'>{shippingAddress.fullName || order.email}</p>
                            <p className='text-gray-500'>{order.email}</p>
                            <hr className='my-3' />
                            <p className='text-xs text-gray-500 mb-1'>Payment method</p>
                            <p className='capitalize'>
                                {order.paymentMethod === 'cod'
                                    ? 'Cash on delivery'
                                    : titleCase(order.paymentMethod || 'razorpay')}
                            </p>
                            <hr className='my-3' />
                            <p className='text-xs text-gray-500 mb-1'>Shipping address</p>
                            <p>{shippingAddress.fullName}</p>
                            <p className='text-gray-600'>{[shippingAddress.line1, shippingAddress.line2, shippingAddress.landmark].filter(Boolean).join(', ')}</p>
                            <p className='text-gray-600'>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}</p>
                            <p className='text-gray-600'>{shippingAddress.country}</p>
                            <p className='text-gray-500 mt-1'>{shippingAddress.phone}</p>
                            {customerNote && (
                                <>
                                    <hr className='my-3' />
                                    <p className='text-xs text-gray-500'>Order note</p>
                                    <p>{customerNote}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold flex items-center gap-2'><FiPackage /> Status</h4>
                        </CardHeader>
                        <CardContent className='p-3 space-y-3 text-sm'>
                            <div>
                                <Label className='mb-1.5 block text-xs text-gray-500'>Payment status</Label>
                                <Select
                                    options={paymentStatus.map((s) => ({ label: titleCase(s), value: s }))}
                                    selected={paymentStatusValue}
                                    setSelected={setPaymentStatusValue}
                                    isMulti={false}
                                />
                            </div>
                            <div>
                                <Label className='mb-1.5 block text-xs text-gray-500'>Fulfillment status</Label>
                                <Select
                                    options={fulfillmentStatus.map((s) => ({ label: titleCase(s), value: s }))}
                                    selected={fulfillmentStatusValue}
                                    setSelected={setFulfillmentStatusValue}
                                    isMulti={false}
                                />
                            </div>
                            <div>
                                <Label className='mb-1.5 block text-xs text-gray-500'>Note (visible in timeline)</Label>
                                <Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder='Optional note' />
                            </div>
                            <ButtonLoading
                                type='button'
                                text='Save status'
                                loading={busy}
                                onClick={saveStatus}
                                className='w-full cursor-pointer'
                            />
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Summary</h4>
                        </CardHeader>
                        <CardContent className='p-3 text-sm'>
                            <table className='w-full'>
                                <tbody>
                                    <tr><td className='py-1 text-gray-500'>Subtotal</td><td className='text-end'>{formatINR(order.subtotal, order.currency)}</td></tr>
                                    {order.discount > 0 && <tr><td className='py-1 text-gray-500'>Discount</td><td className='text-end'>- {formatINR(order.discount, order.currency)}</td></tr>}
                                    {order.couponDiscountAmount > 0 && <tr><td className='py-1 text-gray-500'>Coupon {order.couponCode ? `(${order.couponCode})` : ''}</td><td className='text-end'>- {formatINR(order.couponDiscountAmount, order.currency)}</td></tr>}
                                    {order.taxAmount > 0 && <tr><td className='py-1 text-gray-500'>Tax</td><td className='text-end'>{formatINR(order.taxAmount, order.currency)}</td></tr>}
                                    {order.shippingAmount > 0 && <tr><td className='py-1 text-gray-500'>Shipping</td><td className='text-end'>{formatINR(order.shippingAmount, order.currency)}</td></tr>}
                                    <tr className='border-t'><td className='pt-2 font-medium'>Total</td><td className='pt-2 text-end font-semibold'>{formatINR(order.totalAmount, order.currency)}</td></tr>
                                </tbody>
                            </table>
                            {invoiceAvailable && (
                                <>
                                    <hr className='my-3' />
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-xs text-gray-500'>Invoice</p>
                                            <p className='text-sm font-mono'>{invoice.invoiceNumber}</p>
                                        </div>
                                        <a href={`/api/invoice/${orderRef}/download`} target='_blank' rel='noopener' className='inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition'>
                                            <FiDownload size={12} /> PDF
                                        </a>
                                    </div>
                                </>
                            )}
                            {payments.length > 0 && (
                                <>
                                    <hr className='my-3' />
                                    <p className='text-xs text-gray-500 mb-1'>Payments</p>
                                    {payments.map((p) => (
                                        <p key={p._id} className='text-xs text-gray-600'>
                                            {String(p.gateway).toUpperCase()} · {p.gatewayPaymentId || '—'} · <span className='capitalize'>{titleCase(p.status)}</span>
                                        </p>
                                    ))}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Issue refund</DialogTitle>
                        <DialogDescription>
                            Refundable balance: {formatINR(refundableMax, order.currency || 'INR')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-3'>
                        <div>
                            <Label className='mb-1.5 block'>Amount</Label>
                            <Input type='number' value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} max={refundableMax} />
                        </div>
                        <div>
                            <Label className='mb-1.5 block'>Reason</Label>
                            <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={() => setRefundOpen(false)}>Cancel</Button>
                        <ButtonLoading type='button' text='Issue refund' loading={busy} onClick={handleRefund} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={shipmentOpen} onOpenChange={setShipmentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create shipment</DialogTitle>
                        <DialogDescription>
                            All items in this order will be linked to this shipment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-3'>
                        <div>
                            <Label className='mb-1.5 block'>Carrier</Label>
                            <Input value={shipmentCarrier} onChange={(e) => setShipmentCarrier(e.target.value)} placeholder='e.g. Delhivery' />
                        </div>
                        <div>
                            <Label className='mb-1.5 block'>Tracking number</Label>
                            <Input value={shipmentTracking} onChange={(e) => setShipmentTracking(e.target.value)} />
                        </div>
                        <div>
                            <Label className='mb-1.5 block'>Tracking URL (optional)</Label>
                            <Input value={shipmentUrl} onChange={(e) => setShipmentUrl(e.target.value)} placeholder='https://…' />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={() => setShipmentOpen(false)}>Cancel</Button>
                        <ButtonLoading type='button' text='Create shipment' loading={busy} onClick={handleShipment} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default OrderDetails
