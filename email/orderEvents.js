import {
    renderEmailLayout,
    renderItemsTable,
    renderSummary,
    renderShippingAddress,
    formatINR,
} from './_layout'

/**
 * Public URL the customer clicks to land on the order detail page.
 * Uses orderNumber so the URL works whether the legacy `order_id` is
 * present or not.
 */
const orderUrl = (order) => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    return `${base}/order-details/${order.orderNumber || order.order_id || order._id}`
}
const returnUrl = (returnDoc) => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    return `${base}/returns/${returnDoc.returnNumber || returnDoc._id}`
}

/* ---------- Order lifecycle ---------- */

export const orderConfirmationEmail = (order) => {
    const isCod = order.paymentMethod === 'cod'
    const title = isCod ? 'Order confirmed — pay on delivery' : 'Thanks for your order!'
    const intro = isCod
        ? `We've received your order <strong>${order.orderNumber}</strong>. Please keep <strong>${formatINR(order.totalAmount, order.currency)}</strong> ready in cash for the delivery partner.`
        : `Your payment is confirmed and your order <strong>${order.orderNumber}</strong> is being prepared.`
    return renderEmailLayout({
        preheader: `Order ${order.orderNumber} confirmed`,
        title,
        intro,
        bodyBlocks: [
            renderItemsTable(order.items, order.currency),
            renderSummary(order),
            renderShippingAddress(order.shippingAddress),
        ],
        ctaText: 'View your order',
        ctaUrl: orderUrl(order),
    })
}

export const orderShippedEmail = (order, shipment) => {
    const intro = `Good news — your order <strong>${order.orderNumber}</strong> is on its way.`
    const trackingBlock = `
        <div style="margin-top:16px;padding:16px;background:#f0fdf4;border-radius:6px;border-left:3px solid #16a34a;">
            <p style="margin:0;font-size:13px;color:#374151;"><strong>Carrier:</strong> ${shipment.carrier || '—'}</p>
            ${shipment.trackingNumber ? `<p style="margin:4px 0 0 0;font-size:13px;color:#374151;"><strong>Tracking #:</strong> ${shipment.trackingNumber}</p>` : ''}
            ${shipment.trackingUrl ? `<p style="margin:8px 0 0 0;font-size:13px;"><a href="${shipment.trackingUrl}" style="color:#15803d;text-decoration:underline;" target="_blank">Track shipment →</a></p>` : ''}
        </div>
    `
    return renderEmailLayout({
        preheader: `Order ${order.orderNumber} shipped`,
        title: 'Your order has shipped',
        intro,
        bodyBlocks: [trackingBlock, renderShippingAddress(order.shippingAddress)],
        ctaText: 'View order details',
        ctaUrl: orderUrl(order),
    })
}

export const orderDeliveredEmail = (order) => renderEmailLayout({
    preheader: `Order ${order.orderNumber} delivered`,
    title: 'Order delivered',
    intro: `Your order <strong>${order.orderNumber}</strong> has been marked delivered. We hope you love it!`,
    bodyBlocks: [
        order.paymentMethod === 'cod' && order.paymentStatus !== 'paid'
            ? `<p style="font-size:14px;color:#374151;">Please confirm that the cash collection went through. If anything's off, just reply to this email.</p>`
            : `<p style="font-size:14px;color:#374151;">If you need a return or exchange, you can request one from your order page within 7 days of delivery.</p>`,
    ],
    ctaText: 'View order',
    ctaUrl: orderUrl(order),
    footnote: 'Enjoyed the order? Leave a review — it really helps small businesses like ours.',
})

export const orderCancelledEmail = (order, reason = '') => renderEmailLayout({
    preheader: `Order ${order.orderNumber} cancelled`,
    title: 'Order cancelled',
    intro: `Your order <strong>${order.orderNumber}</strong> has been cancelled.${reason ? ` Reason: <em>${reason}</em>.` : ''}`,
    bodyBlocks: [
        order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid'
            ? `<p style="font-size:14px;color:#374151;">If a refund applies, it will be processed back to your original payment method within 5–7 business days.</p>`
            : `<p style="font-size:14px;color:#374151;">No payment was collected; nothing to refund.</p>`,
    ],
    ctaText: 'View order',
    ctaUrl: orderUrl(order),
})

export const codCollectedEmail = (order) => renderEmailLayout({
    preheader: `Payment received for ${order.orderNumber}`,
    title: 'Payment received — thank you!',
    intro: `We've recorded receipt of <strong>${formatINR(order.totalAmount, order.currency)}</strong> for your order <strong>${order.orderNumber}</strong>. Keep this email as your receipt.`,
    bodyBlocks: [renderSummary(order)],
    ctaText: 'View order',
    ctaUrl: orderUrl(order),
})

export const refundProcessedEmail = (order, refund) => renderEmailLayout({
    preheader: `Refund processed for ${order.orderNumber}`,
    title: 'Your refund is on the way',
    intro: `We've processed a refund of <strong>${formatINR(refund.amount, refund.currency || order.currency)}</strong> for order <strong>${order.orderNumber}</strong>.${refund.reason ? ` Reason: <em>${refund.reason}</em>.` : ''}`,
    bodyBlocks: [
        `<p style="font-size:14px;color:#374151;">Refunds typically take 5–7 business days to reflect on your statement.</p>`,
    ],
    ctaText: 'View order',
    ctaUrl: orderUrl(order),
})

/* ---------- Returns / exchanges ---------- */

export const returnRequestedEmail = (returnDoc, order) => {
    const verb = returnDoc.type === 'exchange' ? 'exchange' : 'return'
    return renderEmailLayout({
        preheader: `Your ${verb} request was received`,
        title: `We've received your ${verb} request`,
        intro: `Request <strong>${returnDoc.returnNumber}</strong> for order <strong>${order.orderNumber}</strong> is now in review. We typically get back within 24 hours.`,
        bodyBlocks: [
            returnDoc.requestNote ? `<p style="font-size:14px;color:#374151;"><strong>Your note:</strong> ${returnDoc.requestNote}</p>` : '',
        ],
        ctaText: `View ${verb} request`,
        ctaUrl: returnUrl(returnDoc),
    })
}

export const returnApprovedEmail = (returnDoc, order) => {
    const verb = returnDoc.type === 'exchange' ? 'exchange' : 'return'
    return renderEmailLayout({
        preheader: `Your ${verb} request was approved`,
        title: `${verb[0].toUpperCase() + verb.slice(1)} approved`,
        intro: `Great news — request <strong>${returnDoc.returnNumber}</strong> is approved. Our team will reach out to schedule a pickup, or you can ship the item back using the address below.`,
        bodyBlocks: [
            returnDoc.adminNote ? `<p style="font-size:14px;color:#374151;"><strong>From our team:</strong> ${returnDoc.adminNote}</p>` : '',
            `<div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:6px;">
                <p style="margin:0 0 4px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Ship to</p>
                <p style="margin:0;font-size:14px;color:#374151;">${process.env.NEXT_PUBLIC_RETURN_ADDRESS || 'Our team will email you the return address.'}</p>
            </div>`,
        ],
        ctaText: `View ${verb} request`,
        ctaUrl: returnUrl(returnDoc),
    })
}

export const returnRejectedEmail = (returnDoc, order) => {
    const verb = returnDoc.type === 'exchange' ? 'exchange' : 'return'
    return renderEmailLayout({
        preheader: `Your ${verb} request couldn't be approved`,
        title: `${verb[0].toUpperCase() + verb.slice(1)} request not approved`,
        intro: `Unfortunately we can't approve request <strong>${returnDoc.returnNumber}</strong> for order <strong>${order.orderNumber}</strong>.`,
        bodyBlocks: [
            returnDoc.adminNote ? `<p style="font-size:14px;color:#374151;"><strong>Reason:</strong> ${returnDoc.adminNote}</p>` : '',
            `<p style="font-size:14px;color:#374151;">If you think this is a mistake, reply to this email and we'll review again.</p>`,
        ],
        ctaText: 'View order',
        ctaUrl: orderUrl(order),
    })
}

export const returnReceivedEmail = (returnDoc, order) => renderEmailLayout({
    preheader: `We received your return`,
    title: 'Return received',
    intro: `We've received the item(s) for request <strong>${returnDoc.returnNumber}</strong>. Our team will inspect them and complete your ${returnDoc.type === 'exchange' ? 'exchange' : 'refund'} shortly.`,
    bodyBlocks: [],
    ctaText: 'View request',
    ctaUrl: returnUrl(returnDoc),
})
