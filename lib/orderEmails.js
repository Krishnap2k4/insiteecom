import { sendMail } from '@/lib/sendMail'
import { logger } from '@/lib/logger'
import { renderTemplate } from '@/lib/emailTemplates'
import {
    orderConfirmationEmail,
    orderShippedEmail,
    orderDeliveredEmail,
    orderCancelledEmail,
    codCollectedEmail,
    refundProcessedEmail,
    returnRequestedEmail,
    returnApprovedEmail,
    returnRejectedEmail,
    returnReceivedEmail,
} from '@/email/orderEvents'

/**
 * Thin wrappers around `sendMail` for each order-lifecycle event.
 * Every helper swallows errors — email delivery must never block the
 * primary operation that triggered it.
 *
 * Each helper queries `renderTemplate(code, data)` first — if an
 * active admin-edited DB template exists, we use that. Otherwise we
 * fall back to the hardcoded `email/*Email(...)` renderer in
 * `email/orderEvents.js`. That way admins can override individual
 * templates without losing the safety net of the hardcoded defaults.
 *
 * `interpolationData` is the shape every DB template can address
 * (e.g. `{{order.orderNumber}}`). Keep keys stable — they're a
 * public contract for template authors.
 */
const dispatch = async (code, to, fallbackSubject, fallbackBody, data) => {
    if (!to) return { success: false, skipped: 'no recipient' }
    let subject = fallbackSubject
    let body = fallbackBody
    try {
        const dbTemplate = await renderTemplate(code, data)
        if (dbTemplate) {
            subject = dbTemplate.subject || subject
            body = dbTemplate.body || body
        }
    } catch (err) {
        // Pure resolution issue — fall through with hardcoded.
        logger.warn(`email template lookup failed: ${code}`, { error: err?.message })
    }
    try {
        const result = await sendMail(subject, to, body)
        if (!result?.success) {
            logger.warn(`email failed: ${code}`, { to, error: result?.message })
        }
        return result
    } catch (err) {
        logger.warn(`email threw: ${code}`, { to, error: err?.message })
        return { success: false, message: err?.message }
    }
}

/**
 * Build the data object an admin-edited template can address.
 * Centralised so every event sees consistent token names.
 */
const orderTokens = (order) => ({
    order: {
        orderNumber: order?.orderNumber || order?.order_id || '',
        totalAmount: order?.totalAmount || 0,
        currency: order?.currency || 'INR',
        paymentMethod: order?.paymentMethod || 'razorpay',
        paymentStatus: order?.paymentStatus || 'pending',
        fulfillmentStatus: order?.fulfillmentStatus || 'unfulfilled',
    },
    customer: {
        name: order?.shippingAddress?.fullName || order?.name || '',
        email: order?.email || '',
    },
    urls: {
        orderDetails: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/order-details/${order?.orderNumber || order?.order_id || ''}`,
    },
})

export const sendOrderConfirmation = (order) => dispatch(
    'order.confirmation',
    order.email,
    `Order ${order.orderNumber} confirmed`,
    orderConfirmationEmail(order),
    orderTokens(order),
)

export const sendOrderShipped = (order, shipment) => dispatch(
    'order.shipped',
    order.email,
    `Your order ${order.orderNumber} has shipped`,
    orderShippedEmail(order, shipment),
    {
        ...orderTokens(order),
        shipment: {
            carrier: shipment?.carrier || '',
            trackingNumber: shipment?.trackingNumber || '',
            trackingUrl: shipment?.trackingUrl || '',
        },
    },
)

export const sendOrderDelivered = (order) => dispatch(
    'order.delivered',
    order.email,
    `Order ${order.orderNumber} delivered`,
    orderDeliveredEmail(order),
    orderTokens(order),
)

export const sendOrderCancelled = (order, reason) => dispatch(
    'order.cancelled',
    order.email,
    `Order ${order.orderNumber} cancelled`,
    orderCancelledEmail(order, reason),
    { ...orderTokens(order), reason: reason || '' },
)

export const sendCodCollected = (order) => dispatch(
    'order.cod_collected',
    order.email,
    `Payment received for ${order.orderNumber}`,
    codCollectedEmail(order),
    orderTokens(order),
)

export const sendRefundProcessed = (order, refund) => dispatch(
    'order.refund_processed',
    order.email,
    `Refund processed for ${order.orderNumber}`,
    refundProcessedEmail(order, refund),
    {
        ...orderTokens(order),
        refund: {
            amount: refund?.amount || 0,
            currency: refund?.currency || order?.currency || 'INR',
            reason: refund?.reason || '',
        },
    },
)

const returnTokens = (returnDoc, order) => ({
    ...orderTokens(order),
    return: {
        returnNumber: returnDoc?.returnNumber || '',
        type: returnDoc?.type || 'return',
        adminNote: returnDoc?.adminNote || '',
        requestNote: returnDoc?.requestNote || '',
        status: returnDoc?.status || '',
    },
})

export const sendReturnRequested = (returnDoc, order) => dispatch(
    'return.requested',
    order.email,
    `Your ${returnDoc.type} request was received`,
    returnRequestedEmail(returnDoc, order),
    returnTokens(returnDoc, order),
)

export const sendReturnApproved = (returnDoc, order) => dispatch(
    'return.approved',
    order.email,
    `Your ${returnDoc.type} request was approved`,
    returnApprovedEmail(returnDoc, order),
    returnTokens(returnDoc, order),
)

export const sendReturnRejected = (returnDoc, order) => dispatch(
    'return.rejected',
    order.email,
    `Your ${returnDoc.type} request was not approved`,
    returnRejectedEmail(returnDoc, order),
    returnTokens(returnDoc, order),
)

export const sendReturnReceived = (returnDoc, order) => dispatch(
    'return.received',
    order.email,
    `We received your return`,
    returnReceivedEmail(returnDoc, order),
    returnTokens(returnDoc, order),
)
