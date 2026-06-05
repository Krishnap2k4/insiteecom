import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import axios from '@/lib/apiClient'
import Image from 'next/image'
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import Link from 'next/link'
import { WEBSITE_INVOICE_DOWNLOAD, WEBSITE_MESSAGES_NEW, WEBSITE_PRODUCT_DETAILS, WEBSITE_RETURN_DETAILS, WEBSITE_RETURN_REQUEST } from '@/routes/WebsiteRoute'
import { RETURN_WINDOW_DAYS } from '@/lib/orders'
import { FiCheckCircle, FiClock, FiDownload, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi'

const PAYMENT_LABEL = {
    paid: { text: 'Paid', cls: 'bg-emerald-100 text-emerald-700', Icon: FiCheckCircle },
    pending: { text: 'Pending', cls: 'bg-amber-100 text-amber-700', Icon: FiClock },
    failed: { text: 'Failed', cls: 'bg-red-100 text-red-700', Icon: FiXCircle },
    refunded: { text: 'Refunded', cls: 'bg-gray-200 text-gray-700', Icon: FiRefreshCw },
    partially_refunded: { text: 'Partially refunded', cls: 'bg-gray-200 text-gray-700', Icon: FiRefreshCw },
}
const FULFILLMENT_LABEL = {
    fulfilled: { text: 'Delivered', cls: 'bg-emerald-100 text-emerald-700', Icon: FiCheckCircle },
    partial: { text: 'Partially shipped', cls: 'bg-sky-100 text-sky-700', Icon: FiTruck },
    unfulfilled: { text: 'Preparing', cls: 'bg-amber-100 text-amber-700', Icon: FiPackage },
    cancelled: { text: 'Cancelled', cls: 'bg-red-100 text-red-700', Icon: FiXCircle },
}
const RETURN_LABEL = {
    requested: { text: 'Requested', cls: 'bg-amber-100 text-amber-700' },
    approved: { text: 'Approved', cls: 'bg-sky-100 text-sky-700' },
    received: { text: 'Items received', cls: 'bg-indigo-100 text-indigo-700' },
    refunded: { text: 'Refunded', cls: 'bg-emerald-100 text-emerald-700' },
    replaced: { text: 'Replaced', cls: 'bg-emerald-100 text-emerald-700' },
    rejected: { text: 'Rejected', cls: 'bg-red-100 text-red-700' },
    cancelled: { text: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
}

const StatusPill = ({ status, dict }) => {
    const meta = dict[status] || { text: status, cls: 'bg-gray-100 text-gray-600', Icon: FiClock }
    const Icon = meta.Icon
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${meta.cls}`}>
            {Icon ? <Icon size={12} /> : null} {meta.text}
        </span>
    )
}

const formatINR = (v, cur = 'INR') =>
    Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: cur })

const OrderDetails = async ({ params }) => {
    const { orderid } = await params
    const { data: orderData } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/get/${orderid}`
    )

    const breadcrumb = { title: 'Order Details', links: [{ label: 'Order Details' }] }

    if (!orderData?.success || !orderData?.data?.order) {
        return (
            <div>
                <WebsiteBreadcrumb props={breadcrumb} />
                <div className='lg:px-32 px-5 my-20'>
                    <div className='flex justify-center items-center py-32'>
                        <h4 className='text-red-500 text-xl font-semibold'>Order Not Found</h4>
                    </div>
                </div>
            </div>
        )
    }

    const {
        order,
        payments = [],
        refunds = [],
        shipments = [],
        statusHistory = [],
        returns = [],
        invoice = null,
        returnable = { bySku: {}, anyReturnable: false, activeReturns: [], eligible: false },
    } = orderData.data
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
    const processedRefundTotal = refunds
        .filter((r) => r.status === 'processed')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const hasProcessedRefund = processedRefundTotal > 0

    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-32 px-5 my-12'>
                <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
                    <div>
                        <h1 className='text-2xl font-semibold'>Order {order.orderNumber || order.order_id}</h1>
                        <p className='text-sm text-gray-500 mt-1'>
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
                                className='ml-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition'
                            >
                                <FiDownload size={12} /> Download invoice
                            </a>
                        )}
                        {returnable.eligible && (
                            <Link
                                href={WEBSITE_RETURN_REQUEST(orderRef)}
                                className='inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition'
                            >
                                Request return / exchange
                            </Link>
                        )}
                        <Link
                            href={WEBSITE_MESSAGES_NEW(orderRef)}
                            className='inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition'
                        >
                            Contact support
                        </Link>
                    </div>
                </div>

                {/* Eligibility / state hints below the header. */}
                {returnable.eligible && returnable.activeReturns.length === 0 && (
                    <p className='text-xs text-gray-500 mb-6'>
                        Eligible for returns or exchanges within {RETURN_WINDOW_DAYS} days of delivery.
                    </p>
                )}
                {!returnable.eligible && order.fulfillmentStatus === 'fulfilled' && !returnable.anyReturnable && returnable.activeReturns.length > 0 && (
                    <p className='text-xs text-gray-500 mb-6'>
                        All eligible items already have an active return — check the Returns section below.
                    </p>
                )}

                {/* Refund banner — prominent because the customer cares
                    most about whether their money came back. */}
                {hasProcessedRefund && (
                    <div className='mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3'>
                        <FiRefreshCw className='mt-0.5 shrink-0 text-emerald-700' />
                        <div>
                            <p className='text-sm font-medium text-emerald-900'>
                                {processedRefundTotal >= (order.totalAmount || 0)
                                    ? `Full refund of ${formatINR(processedRefundTotal, order.currency)} processed`
                                    : `Refund of ${formatINR(processedRefundTotal, order.currency)} processed`}
                            </p>
                            <p className='text-xs text-emerald-700 mt-0.5'>Refunds typically reach your statement in 5–7 business days.</p>
                        </div>
                    </div>
                )}

                <div className='grid lg:grid-cols-[2fr_1fr] gap-6'>
                    <div className='space-y-6'>
                        <section className='border rounded-md overflow-hidden'>
                            <div className='px-4 py-3 border-b bg-gray-50 font-medium'>Items</div>
                            <table className='w-full'>
                                <tbody>
                                    {items.map((it, idx) => {
                                        const skuKey = String(it.sku || '').trim()
                                        const skuInfo = skuKey ? returnable.bySku?.[skuKey] : null
                                        const inActiveReturn = skuInfo && skuInfo.inActiveReturns > 0
                                        return (
                                            <tr key={idx} className='border-b last:border-b-0'>
                                                <td className='p-4'>
                                                    <div className='flex items-center gap-4'>
                                                        <Image
                                                            src={it.image || it?.variant?.media?.[0]?.secure_url || placeholderImg.src}
                                                            width={60} height={60}
                                                            alt={it.name || ''}
                                                            className='rounded border object-cover'
                                                        />
                                                        <div className='min-w-0'>
                                                            <p className='font-medium line-clamp-1'>
                                                                {it?.product?.slug ? (
                                                                    <Link href={WEBSITE_PRODUCT_DETAILS(it.product.slug, it.product.publicId)}>
                                                                        {it.name}
                                                                    </Link>
                                                                ) : it.name}
                                                            </p>
                                                            {(it.optionValuesSnapshot || []).length > 0 && (
                                                                <p className='text-xs text-gray-500 mt-0.5'>
                                                                    {it.optionValuesSnapshot.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                                </p>
                                                            )}
                                                            {it.sku && <p className='text-xs text-gray-400'>SKU: {it.sku}</p>}
                                                            {inActiveReturn && (
                                                                <div className='mt-1.5 flex flex-wrap gap-1'>
                                                                    {skuInfo.activeRefs.map((ref, i) => (
                                                                        <span key={i} className='inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800'>
                                                                            <FiRefreshCw size={10} /> {ref.qty} {ref.type === 'exchange' ? 'in exchange' : 'in return'} · {ref.status}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='p-4 text-right text-sm whitespace-nowrap'>
                                                    {it.qty} × {formatINR(it.sellingPrice, order.currency || 'INR')}
                                                    <p className='font-medium mt-0.5'>{formatINR(it.lineTotal || (it.qty * it.sellingPrice), order.currency || 'INR')}</p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </section>

                        {returns.length > 0 && (
                            <section className='border rounded-md overflow-hidden'>
                                <div className='px-4 py-3 border-b bg-gray-50 font-medium flex items-center justify-between'>
                                    <span>Returns &amp; exchanges</span>
                                </div>
                                <div className='divide-y'>
                                    {returns.map((r) => (
                                        <Link
                                            key={r._id}
                                            href={WEBSITE_RETURN_DETAILS(r.returnNumber || r._id)}
                                            className='flex items-center justify-between gap-4 p-4 hover:bg-gray-50 transition'
                                        >
                                            <div className='min-w-0'>
                                                <p className='font-medium text-sm'>
                                                    {r.returnNumber}
                                                    <span className='ml-2 text-xs text-gray-500 capitalize'>{r.type}</span>
                                                </p>
                                                <p className='text-xs text-gray-500 mt-0.5'>
                                                    {(r.items || []).reduce((s, i) => s + (i.qty || 0), 0)} item(s) · requested {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <StatusPill status={r.status} dict={RETURN_LABEL} />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {shipments.length > 0 && (
                            <section className='border rounded-md overflow-hidden'>
                                <div className='px-4 py-3 border-b bg-gray-50 font-medium'>Shipment tracking</div>
                                <div className='divide-y'>
                                    {shipments.map((sh) => (
                                        <div key={sh._id} className='p-4 flex items-center justify-between gap-4'>
                                            <div>
                                                <p className='font-medium text-sm'>{sh.carrier || 'Carrier'} · {sh.trackingNumber || '—'}</p>
                                                <p className='text-xs text-gray-500 mt-0.5 capitalize'>{String(sh.status).replace('_', ' ')}</p>
                                            </div>
                                            {sh.trackingUrl && (
                                                <a href={sh.trackingUrl} target='_blank' rel='noopener noreferrer' className='text-sm text-primary hover:underline'>
                                                    Track →
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {refunds.length > 0 && (
                            <section className='border rounded-md overflow-hidden'>
                                <div className='px-4 py-3 border-b bg-gray-50 font-medium'>Refunds</div>
                                <div className='divide-y'>
                                    {refunds.map((r) => (
                                        <div key={r._id} className='p-4 flex items-center justify-between gap-4'>
                                            <div>
                                                <p className='font-medium text-sm'>{formatINR(r.amount, r.currency || order.currency)}</p>
                                                <p className='text-xs text-gray-500 capitalize'>{r.status} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                {r.reason && <p className='text-xs text-gray-400 mt-0.5'>{r.reason}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {statusHistory.length > 0 && (
                            <section className='border rounded-md overflow-hidden'>
                                <div className='px-4 py-3 border-b bg-gray-50 font-medium'>Timeline</div>
                                <ol className='p-4 space-y-3'>
                                    {statusHistory.map((h) => (
                                        <li key={h._id} className='flex gap-3 text-sm'>
                                            <span className='w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0' />
                                            <div>
                                                <p className='capitalize'>
                                                    <strong>{String(h.statusType)}</strong> → {String(h.toStatus).replace('_', ' ')}
                                                </p>
                                                {h.note && <p className='text-xs text-gray-500'>{h.note}</p>}
                                                <p className='text-xs text-gray-400'>
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

                    <div className='space-y-6'>
                        <section className='border rounded-md p-4'>
                            <h3 className='font-medium mb-3'>Shipping address</h3>
                            <p className='text-sm font-medium'>{shippingAddress.fullName}</p>
                            <p className='text-sm text-gray-600 mt-1'>
                                {[shippingAddress.line1, shippingAddress.line2, shippingAddress.landmark].filter(Boolean).join(', ')}
                            </p>
                            <p className='text-sm text-gray-600'>
                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                            </p>
                            <p className='text-sm text-gray-600'>{shippingAddress.country}</p>
                            <p className='text-sm text-gray-500 mt-2'>{shippingAddress.phone}</p>
                            {customerNote && (
                                <>
                                    <hr className='my-3' />
                                    <p className='text-xs text-gray-500'>Order note:</p>
                                    <p className='text-sm'>{customerNote}</p>
                                </>
                            )}
                        </section>

                        <section className='border rounded-md p-4'>
                            <h3 className='font-medium mb-3'>Summary</h3>
                            <table className='w-full text-sm'>
                                <tbody>
                                    <tr>
                                        <td className='py-1 text-gray-500'>Subtotal</td>
                                        <td className='py-1 text-end'>{formatINR(order.subtotal, order.currency)}</td>
                                    </tr>
                                    {order.discount > 0 && (
                                        <tr>
                                            <td className='py-1 text-gray-500'>Item discount</td>
                                            <td className='py-1 text-end'>- {formatINR(order.discount, order.currency)}</td>
                                        </tr>
                                    )}
                                    {order.couponDiscountAmount > 0 && (
                                        <tr>
                                            <td className='py-1 text-gray-500'>Coupon {order.couponCode ? `(${order.couponCode})` : ''}</td>
                                            <td className='py-1 text-end'>- {formatINR(order.couponDiscountAmount, order.currency)}</td>
                                        </tr>
                                    )}
                                    {order.taxAmount > 0 && (
                                        <tr>
                                            <td className='py-1 text-gray-500'>Tax</td>
                                            <td className='py-1 text-end'>{formatINR(order.taxAmount, order.currency)}</td>
                                        </tr>
                                    )}
                                    {order.shippingAmount > 0 && (
                                        <tr>
                                            <td className='py-1 text-gray-500'>Shipping</td>
                                            <td className='py-1 text-end'>{formatINR(order.shippingAmount, order.currency)}</td>
                                        </tr>
                                    )}
                                    <tr className='border-t'>
                                        <td className='pt-2 font-medium'>Total</td>
                                        <td className='pt-2 text-end font-semibold'>{formatINR(order.totalAmount, order.currency)}</td>
                                    </tr>
                                    {hasProcessedRefund && (
                                        <tr>
                                            <td className='py-1 text-gray-500'>Refunded</td>
                                            <td className='py-1 text-end text-emerald-700'>- {formatINR(processedRefundTotal, order.currency)}</td>
                                        </tr>
                                    )}
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
                                        <a
                                            href={WEBSITE_INVOICE_DOWNLOAD(orderRef)}
                                            target='_blank'
                                            rel='noopener'
                                            className='inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition'
                                        >
                                            <FiDownload size={12} /> Download PDF
                                        </a>
                                    </div>
                                </>
                            )}
                            <hr className='my-3' />
                            <p className='text-xs text-gray-500 mb-1'>Payment method</p>
                            <p className='text-sm capitalize'>
                                {order.paymentMethod === 'cod'
                                    ? 'Cash on delivery'
                                    : String(order.paymentMethod || 'razorpay')}
                                {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                                    <span className='ml-2 text-xs text-amber-700'>Pay {formatINR(order.totalAmount, order.currency)} on delivery</span>
                                )}
                            </p>
                            {payments.length > 0 && (
                                <>
                                    <hr className='my-3' />
                                    <p className='text-xs text-gray-500 mb-1'>Payments</p>
                                    {payments.map((p) => (
                                        <p key={p._id} className='text-xs text-gray-600'>
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
