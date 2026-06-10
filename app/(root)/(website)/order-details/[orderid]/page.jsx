import { isAuthenticated } from '@/lib/authentication'
import { redirect } from 'next/navigation'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import Image from 'next/image'
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import Link from 'next/link'
import {
    WEBSITE_INVOICE_DOWNLOAD, WEBSITE_MESSAGES_NEW,
    WEBSITE_PRODUCT_DETAILS, WEBSITE_RETURN_DETAILS, WEBSITE_RETURN_REQUEST,
} from '@/routes/WebsiteRoute'
import { RETURN_WINDOW_DAYS, isReturnEligible, summarizeReturnableItems } from '@/lib/orders'
import { connectDB } from '@/lib/databaseConnection'
import OrderModel from '@/models/Order.model'
import PaymentModel from '@/models/Payment.model'
import RefundModel from '@/models/Refund.model'
import ShipmentModel from '@/models/Shipment.model'
import OrderStatusHistoryModel from '@/models/OrderStatusHistory.model'
import ReturnModel from '@/models/Return.model'
import InvoiceModel from '@/models/Invoice.model'
import { FiCheckCircle, FiClock, FiDownload, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi'

const PAYMENT_LABEL = {
    paid:               { text: 'Paid',               cls: 'bg-emerald-500/20 text-emerald-400', Icon: FiCheckCircle },
    pending:            { text: 'Pending',             cls: 'bg-amber-500/20 text-amber-400',     Icon: FiClock },
    failed:             { text: 'Failed',              cls: 'bg-red-500/20 text-red-400',         Icon: FiXCircle },
    refunded:           { text: 'Refunded',            cls: 'bg-white/10 text-white/50',          Icon: FiRefreshCw },
    partially_refunded: { text: 'Partially refunded', cls: 'bg-white/10 text-white/50',          Icon: FiRefreshCw },
}
const FULFILLMENT_LABEL = {
    fulfilled:  { text: 'Delivered',         cls: 'bg-emerald-500/20 text-emerald-400', Icon: FiCheckCircle },
    partial:    { text: 'Partially shipped', cls: 'bg-sky-500/20 text-sky-400',         Icon: FiTruck },
    unfulfilled:{ text: 'Preparing',         cls: 'bg-amber-500/20 text-amber-400',     Icon: FiPackage },
    cancelled:  { text: 'Cancelled',         cls: 'bg-red-500/20 text-red-400',         Icon: FiXCircle },
}
const RETURN_LABEL = {
    requested: { text: 'Requested',      cls: 'bg-amber-500/20 text-amber-400' },
    approved:  { text: 'Approved',       cls: 'bg-sky-500/20 text-sky-400' },
    received:  { text: 'Items received', cls: 'bg-indigo-500/20 text-indigo-400' },
    refunded:  { text: 'Refunded',       cls: 'bg-emerald-500/20 text-emerald-400' },
    replaced:  { text: 'Replaced',       cls: 'bg-emerald-500/20 text-emerald-400' },
    rejected:  { text: 'Rejected',       cls: 'bg-red-500/20 text-red-400' },
    cancelled: { text: 'Cancelled',      cls: 'bg-white/10 text-white/50' },
}

const StatusPill = ({ status, dict }) => {
    const meta = dict[status] || { text: status, cls: 'bg-white/10 text-white/50', Icon: FiClock }
    const Icon = meta.Icon
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${meta.cls}`}>
            {Icon ? <Icon size={12} /> : null} {meta.text}
        </span>
    )
}

const formatINR = (v, cur = 'INR') =>
    Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: cur })

const breadcrumb = { title: 'Order Details', links: [{ label: 'Order Details' }] }

const NotFound = () => (
    <div>
        <WebsiteBreadcrumb props={breadcrumb} />
        <div className='lg:px-32 px-5 my-20'>
            <div className='flex justify-center items-center py-32'>
                <h4 className='text-red-500 text-xl font-semibold'>Order Not Found</h4>
            </div>
        </div>
    </div>
)

const OrderDetails = async ({ params }) => {
    const auth = await isAuthenticated()
    if (!auth.isAuth) redirect(WEBSITE_LOGIN)

    const { orderid } = await params

    let order, payments, refunds, shipments, statusHistory, returns, invoice

    try {
        await connectDB()

        const or = [{ orderNumber: orderid.toUpperCase() }, { order_id: orderid }]
        if (/^[0-9a-fA-F]{24}$/.test(orderid)) or.push({ _id: orderid })

        order = await OrderModel.findOne({ $or: or, deletedAt: null })
            .populate('items.product', 'name slug publicId')
            .lean()

        if (!order) return <NotFound />

        ;[payments, refunds, shipments, statusHistory, returns, invoice] = await Promise.all([
            PaymentModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: 1 }).lean(),
            RefundModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: 1 }).lean(),
            ShipmentModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: 1 }).lean(),
            OrderStatusHistoryModel.find({ order: order._id }).sort({ createdAt: 1 }).lean(),
            ReturnModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
            InvoiceModel.findOne({ order: order._id, deletedAt: null }).lean(),
        ])
    } catch (err) {
        console.error('[order-details] DB error:', err)
        return <NotFound />
    }

    const returnable = summarizeReturnableItems(order, returns)
    const eligible = isReturnEligible(order) && returnable.anyReturnable

    const invoiceAvailable = Boolean(invoice?.invoiceNumber)
    const orderRef = order.orderNumber || order._id

    const items = order.items?.length > 0
        ? order.items
        : (order.products || []).map((p) => ({
            product: p.productId,
            variant: p.variantId,
            name: p.name,
            qty: p.qty,
            mrp: p.mrp,
            sellingPrice: p.sellingPrice,
            lineTotal: (p.sellingPrice || 0) * (p.qty || 0),
            image: p?.variantId?.media?.[0]?.secure_url,
            optionValuesSnapshot: [],
            sku: '',
        }))

    const shippingAddress = order.shippingAddress?.line1
        ? order.shippingAddress
        : {
            fullName: order.name, phone: order.phone, line1: '', line2: '',
            landmark: order.landmark, city: order.city, state: order.state,
            country: order.country, pincode: order.pincode,
        }

    const customerNote = order.customerNote || order.ordernote || ''
    const processedRefundTotal = (refunds || [])
        .filter((r) => r.status === 'processed')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const hasProcessedRefund = processedRefundTotal > 0

    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-32 px-5 my-12'>
                {/* Header */}
                <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
                    <div>
                        <h1 className='text-2xl font-serif-display text-[#F0D77C]'>Order {order.orderNumber || order.order_id}</h1>
                        <p className='text-sm text-white/50 mt-1'>
                            Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <div className='flex flex-wrap gap-2 items-center'>
                        <StatusPill status={order.paymentStatus} dict={PAYMENT_LABEL} />
                        <StatusPill status={order.fulfillmentStatus} dict={FULFILLMENT_LABEL} />
                        {invoiceAvailable && (
                            <a
                                href={WEBSITE_INVOICE_DOWNLOAD(orderRef)}
                                target='_blank'
                                rel='noopener'
                                className='ml-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#C9A24B]/30 text-[#C9A24B] hover:bg-[#C9A24B]/10 hover:text-[#F0D77C] transition'
                            >
                                <FiDownload size={12} /> Download invoice
                            </a>
                        )}
                        {eligible && (
                            <Link
                                href={WEBSITE_RETURN_REQUEST(orderRef)}
                                className='inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-[#15110a] border border-[#C9A24B] text-[#F0D77C] hover:bg-[#C9A24B]/10 transition'
                            >
                                Request return / exchange
                            </Link>
                        )}
                        <Link
                            href={WEBSITE_MESSAGES_NEW(orderRef)}
                            className='inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-[#C9A24B]/30 text-[#C9A24B] hover:bg-[#C9A24B]/10 hover:text-[#F0D77C] transition'
                        >
                            Contact support
                        </Link>
                    </div>
                </div>

                {eligible && returnable.activeReturns.length === 0 && (
                    <p className='text-xs text-white/50 mb-6'>
                        Eligible for returns or exchanges within {RETURN_WINDOW_DAYS} days of delivery.
                    </p>
                )}
                {!eligible && order.fulfillmentStatus === 'fulfilled' && !returnable.anyReturnable && returnable.activeReturns.length > 0 && (
                    <p className='text-xs text-white/50 mb-6'>
                        All eligible items already have an active return — check the Returns section below.
                    </p>
                )}

                {hasProcessedRefund && (
                    <div className='mb-6 rounded-md border border-[#C9A24B]/30 bg-[#C9A24B]/10 p-4 flex items-start gap-3'>
                        <FiRefreshCw className='mt-0.5 shrink-0 text-[#C9A24B]' />
                        <div>
                            <p className='text-sm font-medium text-[#F0D77C]'>
                                {processedRefundTotal >= (order.totalAmount || 0)
                                    ? `Full refund of ${formatINR(processedRefundTotal, order.currency)} processed`
                                    : `Refund of ${formatINR(processedRefundTotal, order.currency)} processed`}
                            </p>
                            <p className='text-xs text-[#C9A24B] mt-0.5'>Refunds typically reach your statement in 5–7 business days.</p>
                        </div>
                    </div>
                )}

                <div className='grid lg:grid-cols-[2fr_1fr] gap-6'>
                    <div className='space-y-6'>
                        {/* Items */}
                        <section className='border border-[#C9A24B]/20 rounded-md overflow-hidden bg-[#0a0805]'>
                            <div className='px-4 py-3 border-b border-[#C9A24B]/20 bg-[#15110a] font-medium text-[#F0D77C]'>Items</div>
                            <table className='w-full'>
                                <tbody>
                                    {items.map((it, idx) => {
                                        const skuKey = String(it.sku || '').trim()
                                        const skuInfo = skuKey ? returnable.bySku?.[skuKey] : null
                                        const inActiveReturn = skuInfo && skuInfo.inActiveReturns > 0
                                        return (
                                            <tr key={idx} className='border-b border-[#C9A24B]/10 last:border-b-0'>
                                                <td className='p-4'>
                                                    <div className='flex items-center gap-4'>
                                                        <Image
                                                            src={it.image || it?.variant?.media?.[0]?.secure_url || placeholderImg.src}
                                                            width={60} height={60}
                                                            alt={it.name || ''}
                                                            className='rounded border border-[#C9A24B]/20 object-cover bg-white/5'
                                                        />
                                                        <div className='min-w-0'>
                                                            <p className='font-medium line-clamp-1'>
                                                                {it?.product?.slug ? (
                                                                    <Link href={WEBSITE_PRODUCT_DETAILS(it.product.slug, it.product.publicId)} className='text-[#C9A24B] hover:text-[#F0D77C] transition-colors'>
                                                                        {it.name}
                                                                    </Link>
                                                                ) : <span className='text-white'>{it.name}</span>}
                                                            </p>
                                                            {(it.optionValuesSnapshot || []).length > 0 && (
                                                                <p className='text-xs text-white/50 mt-0.5'>
                                                                    {it.optionValuesSnapshot.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                                </p>
                                                            )}
                                                            {it.sku && <p className='text-xs text-white/40'>SKU: {it.sku}</p>}
                                                            {inActiveReturn && (
                                                                <div className='mt-1.5 flex flex-wrap gap-1'>
                                                                    {skuInfo.activeRefs.map((ref, i) => (
                                                                        <span key={i} className='inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400'>
                                                                            <FiRefreshCw size={10} /> {ref.qty} {ref.type === 'exchange' ? 'in exchange' : 'in return'} · {ref.status}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='p-4 text-right text-sm whitespace-nowrap text-white/70'>
                                                    {it.qty} × {formatINR(it.sellingPrice, order.currency || 'INR')}
                                                    <p className='font-medium mt-0.5 text-white'>{formatINR(it.lineTotal || (it.qty * it.sellingPrice), order.currency || 'INR')}</p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </section>

                        {/* Returns */}
                        {returns.length > 0 && (
                            <section className='border border-[#C9A24B]/20 rounded-md overflow-hidden bg-[#0a0805]'>
                                <div className='px-4 py-3 border-b border-[#C9A24B]/20 bg-[#15110a] font-medium flex items-center justify-between text-[#F0D77C]'>
                                    <span>Returns &amp; exchanges</span>
                                </div>
                                <div className='divide-y divide-[#C9A24B]/10'>
                                    {returns.map((r) => (
                                        <Link
                                            key={r._id}
                                            href={WEBSITE_RETURN_DETAILS(r.returnNumber || r._id)}
                                            className='flex items-center justify-between gap-4 p-4 hover:bg-white/5 transition-colors'
                                        >
                                            <div className='min-w-0'>
                                                <p className='font-medium text-sm text-[#C9A24B]'>
                                                    {r.returnNumber}
                                                    <span className='ml-2 text-xs text-white/50 capitalize'>{r.type}</span>
                                                </p>
                                                <p className='text-xs text-white/40 mt-0.5'>
                                                    {(r.items || []).reduce((s, i) => s + (i.qty || 0), 0)} item(s) · requested {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <StatusPill status={r.status} dict={RETURN_LABEL} />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Shipments */}
                        {shipments.length > 0 && (
                            <section className='border border-[#C9A24B]/20 rounded-md overflow-hidden bg-[#0a0805]'>
                                <div className='px-4 py-3 border-b border-[#C9A24B]/20 bg-[#15110a] font-medium text-[#F0D77C]'>Shipment tracking</div>
                                <div className='divide-y divide-[#C9A24B]/10'>
                                    {shipments.map((sh) => (
                                        <div key={sh._id} className='p-4 flex items-center justify-between gap-4'>
                                            <div>
                                                <p className='font-medium text-sm text-white'>{sh.carrier || 'Carrier'} · <span className='text-[#C9A24B]'>{sh.trackingNumber || '—'}</span></p>
                                                <p className='text-xs text-white/50 mt-0.5 capitalize'>{String(sh.status).replace('_', ' ')}</p>
                                            </div>
                                            {sh.trackingUrl && (
                                                <a href={sh.trackingUrl} target='_blank' rel='noopener noreferrer' className='text-sm text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors'>
                                                    Track →
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Refunds */}
                        {refunds.length > 0 && (
                            <section className='border border-[#C9A24B]/20 rounded-md overflow-hidden bg-[#0a0805]'>
                                <div className='px-4 py-3 border-b border-[#C9A24B]/20 bg-[#15110a] font-medium text-[#F0D77C]'>Refunds</div>
                                <div className='divide-y divide-[#C9A24B]/10'>
                                    {refunds.map((r) => (
                                        <div key={r._id} className='p-4 flex items-center justify-between gap-4'>
                                            <div>
                                                <p className='font-medium text-sm text-emerald-400'>{formatINR(r.amount, r.currency || order.currency)}</p>
                                                <p className='text-xs text-white/50 capitalize'>{r.status} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                {r.reason && <p className='text-xs text-white/40 mt-0.5'>{r.reason}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Timeline */}
                        {statusHistory.length > 0 && (
                            <section className='border border-[#C9A24B]/20 rounded-md overflow-hidden bg-[#0a0805]'>
                                <div className='px-4 py-3 border-b border-[#C9A24B]/20 bg-[#15110a] font-medium text-[#F0D77C]'>Timeline</div>
                                <ol className='p-4 space-y-3'>
                                    {statusHistory.map((h) => (
                                        <li key={h._id} className='flex gap-3 text-sm'>
                                            <span className='w-2 h-2 mt-1.5 rounded-full bg-[#C9A24B] shrink-0' />
                                            <div>
                                                <p className='capitalize text-white'>
                                                    <strong>{String(h.statusType)}</strong> → {String(h.toStatus).replace('_', ' ')}
                                                </p>
                                                {h.note && <p className='text-xs text-white/50'>{h.note}</p>}
                                                <p className='text-xs text-white/40'>
                                                    {new Date(h.createdAt).toLocaleString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className='space-y-6'>
                        <section className='border border-[#C9A24B]/20 rounded-md p-4 bg-[#0a0805]'>
                            <h3 className='font-medium mb-3 text-[#F0D77C]'>Shipping address</h3>
                            <p className='text-sm font-medium text-white'>{shippingAddress.fullName}</p>
                            <p className='text-sm text-white/60 mt-1'>
                                {[shippingAddress.line1, shippingAddress.line2, shippingAddress.landmark].filter(Boolean).join(', ')}
                            </p>
                            <p className='text-sm text-white/60'>
                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                            </p>
                            <p className='text-sm text-white/60'>{shippingAddress.country}</p>
                            <p className='text-sm text-white/50 mt-2'>{shippingAddress.phone}</p>
                            {customerNote && (
                                <>
                                    <hr className='my-3 border-[#C9A24B]/10' />
                                    <p className='text-xs text-white/50'>Order note:</p>
                                    <p className='text-sm text-white/80'>{customerNote}</p>
                                </>
                            )}
                        </section>

                        <section className='border border-[#C9A24B]/20 rounded-md p-4 bg-[#0a0805]'>
                            <h3 className='font-medium mb-3 text-[#F0D77C]'>Summary</h3>
                            <table className='w-full text-sm'>
                                <tbody>
                                    <tr>
                                        <td className='py-1 text-white/50'>Subtotal</td>
                                        <td className='py-1 text-end text-white/80'>{formatINR(order.subtotal, order.currency)}</td>
                                    </tr>
                                    {order.discount > 0 && (
                                        <tr>
                                            <td className='py-1 text-white/50'>Item discount</td>
                                            <td className='py-1 text-end text-[#C9A24B]'>- {formatINR(order.discount, order.currency)}</td>
                                        </tr>
                                    )}
                                    {order.couponDiscountAmount > 0 && (
                                        <tr>
                                            <td className='py-1 text-white/50'>Coupon {order.couponCode ? `(${order.couponCode})` : ''}</td>
                                            <td className='py-1 text-end text-[#C9A24B]'>- {formatINR(order.couponDiscountAmount, order.currency)}</td>
                                        </tr>
                                    )}
                                    {order.taxAmount > 0 && (
                                        <tr>
                                            <td className='py-1 text-white/50'>Tax</td>
                                            <td className='py-1 text-end text-white/80'>{formatINR(order.taxAmount, order.currency)}</td>
                                        </tr>
                                    )}
                                    {order.shippingAmount > 0 && (
                                        <tr>
                                            <td className='py-1 text-white/50'>Shipping</td>
                                            <td className='py-1 text-end text-white/80'>{formatINR(order.shippingAmount, order.currency)}</td>
                                        </tr>
                                    )}
                                    <tr className='border-t border-[#C9A24B]/10'>
                                        <td className='pt-2 font-medium text-white'>Total</td>
                                        <td className='pt-2 text-end font-semibold text-[#F0D77C]'>{formatINR(order.totalAmount, order.currency)}</td>
                                    </tr>
                                    {hasProcessedRefund && (
                                        <tr>
                                            <td className='py-1 text-white/50'>Refunded</td>
                                            <td className='py-1 text-end text-emerald-400'>- {formatINR(processedRefundTotal, order.currency)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {invoiceAvailable && (
                                <>
                                    <hr className='my-3 border-[#C9A24B]/10' />
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-xs text-white/50'>Invoice</p>
                                            <p className='text-sm font-mono text-white/80'>{invoice.invoiceNumber}</p>
                                        </div>
                                        <a
                                            href={WEBSITE_INVOICE_DOWNLOAD(orderRef)}
                                            target='_blank'
                                            rel='noopener'
                                            className='inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-[#C9A24B]/30 text-[#C9A24B] hover:bg-[#C9A24B]/10 hover:text-[#F0D77C] transition-colors'
                                        >
                                            <FiDownload size={12} /> Download PDF
                                        </a>
                                    </div>
                                </>
                            )}

                            <hr className='my-3 border-[#C9A24B]/10' />
                            <p className='text-xs text-white/50 mb-1'>Payment method</p>
                            <p className='text-sm capitalize text-white/80'>
                                {order.paymentMethod === 'cod'
                                    ? 'Cash on delivery'
                                    : String(order.paymentMethod || 'razorpay')}
                                {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                                    <span className='ml-2 text-xs text-amber-400'>Pay {formatINR(order.totalAmount, order.currency)} on delivery</span>
                                )}
                            </p>

                            {payments.length > 0 && (
                                <>
                                    <hr className='my-3 border-[#C9A24B]/10' />
                                    <p className='text-xs text-white/50 mb-1'>Payments</p>
                                    {payments.map((p) => (
                                        <p key={p._id} className='text-xs text-white/60'>
                                            {String(p.gateway).toUpperCase()} · {p.gatewayPaymentId || '—'} · {String(p.status).replace('_', ' ')}
                                        </p>
                                    ))}
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderDetails
