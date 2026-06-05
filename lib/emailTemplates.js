import EmailTemplateModel from '@/models/EmailTemplate.model'
import { logger } from '@/lib/logger'

/**
 * Handlebars-lite token replacement. Supports `{{var}}` and
 * `{{nested.path}}`. Anything else (loops, conditionals) renders as
 * empty. That's intentional — transactional templates rarely need
 * more than scalar interpolation, and a fuller template engine adds
 * weight without obvious benefit at this stage.
 */
export const interpolate = (template, data) => {
    if (!template) return ''
    return String(template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
        const value = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data)
        if (value == null) return ''
        if (typeof value === 'object') return ''
        return String(value)
    })
}

/**
 * Look up a DB template by code. Returns null when none active —
 * callers fall back to their hardcoded template.
 */
export const findActiveTemplate = async (code, locale = 'en') => {
    if (!code) return null
    try {
        const tmpl = await EmailTemplateModel
            .findOne({ code: String(code).toLowerCase(), locale, isActive: true, deletedAt: null })
            .lean()
        return tmpl || null
    } catch (err) {
        logger.warn('email template lookup failed', { code, error: err?.message })
        return null
    }
}

/**
 * One-shot: given an event code, return either the DB-rendered
 * { subject, body } pair or null. Used by `safe()` in
 * `lib/orderEmails.js`.
 */
export const renderTemplate = async (code, data) => {
    const tmpl = await findActiveTemplate(code)
    if (!tmpl) return null
    return {
        subject: interpolate(tmpl.subject, data),
        body: interpolate(tmpl.body, data),
        templateId: String(tmpl._id),
    }
}

/**
 * Catalog of every event code emitted by `lib/orderEmails.js` plus
 * the documented variables admins can use. Mirrors the file-based
 * templates so the admin "Add new template" flow can prefill the
 * variable list.
 *
 * `defaults.subject` and `defaults.bodyHint` are shown in the admin
 * UI as "what the hardcoded template uses today" so admins know how
 * to maintain parity if they choose to override.
 */
export const EVENT_CATALOG = [
    {
        code: 'order.confirmation',
        name: 'Order confirmation',
        description: 'Sent right after an order is placed (online or COD).',
        variables: [
            { name: 'order.orderNumber', description: 'Human-friendly order number (ORD-…)' },
            { name: 'order.totalAmount', description: 'Order grand total' },
            { name: 'order.currency', description: 'Order currency (e.g. INR)' },
            { name: 'order.paymentMethod', description: 'razorpay | cod' },
            { name: 'order.paymentStatus', description: 'paid | pending | failed | refunded' },
            { name: 'customer.name', description: 'Customer full name (from shipping address)' },
            { name: 'customer.email', description: 'Customer email' },
            { name: 'urls.orderDetails', description: 'Storefront link to the order detail page' },
        ],
    },
    {
        code: 'order.shipped',
        name: 'Order shipped',
        description: 'Sent when a shipment is created for an order.',
        variables: [
            { name: 'order.orderNumber', description: 'Order number' },
            { name: 'shipment.carrier', description: 'Carrier name' },
            { name: 'shipment.trackingNumber', description: 'Tracking number' },
            { name: 'shipment.trackingUrl', description: 'Tracking URL' },
            { name: 'urls.orderDetails', description: 'Order detail page' },
        ],
    },
    {
        code: 'order.delivered',
        name: 'Order delivered',
        description: 'Sent when the final shipment is marked delivered.',
        variables: [
            { name: 'order.orderNumber', description: 'Order number' },
            { name: 'customer.name', description: 'Customer name' },
            { name: 'urls.orderDetails', description: 'Order detail page' },
        ],
    },
    {
        code: 'order.cancelled',
        name: 'Order cancelled',
        description: 'Sent when an order is marked cancelled.',
        variables: [
            { name: 'order.orderNumber', description: 'Order number' },
            { name: 'reason', description: 'Cancellation reason' },
        ],
    },
    {
        code: 'order.cod_collected',
        name: 'COD cash collected',
        description: 'Sent after the admin marks cash collected on a COD order.',
        variables: [
            { name: 'order.orderNumber', description: 'Order number' },
            { name: 'order.totalAmount', description: 'Amount collected' },
        ],
    },
    {
        code: 'order.refund_processed',
        name: 'Refund processed',
        description: 'Sent when a refund is processed.',
        variables: [
            { name: 'order.orderNumber', description: 'Order number' },
            { name: 'refund.amount', description: 'Refund amount' },
            { name: 'refund.reason', description: 'Reason' },
        ],
    },
    {
        code: 'return.requested',
        name: 'Return requested',
        description: 'Customer acknowledgment after they submit a return.',
        variables: [
            { name: 'return.returnNumber', description: 'Return request id' },
            { name: 'return.type', description: 'return | exchange' },
            { name: 'order.orderNumber', description: 'Related order number' },
        ],
    },
    {
        code: 'return.approved',
        name: 'Return approved',
        description: 'Sent when admin approves a return.',
        variables: [
            { name: 'return.returnNumber', description: 'Return request id' },
            { name: 'return.adminNote', description: 'Admin note / instructions' },
            { name: 'order.orderNumber', description: 'Order number' },
        ],
    },
    {
        code: 'return.rejected',
        name: 'Return rejected',
        description: 'Sent when admin rejects a return.',
        variables: [
            { name: 'return.returnNumber', description: 'Return request id' },
            { name: 'return.adminNote', description: 'Reason' },
        ],
    },
    {
        code: 'return.received',
        name: 'Return received',
        description: 'Sent when admin marks the items as received.',
        variables: [
            { name: 'return.returnNumber', description: 'Return request id' },
            { name: 'return.type', description: 'return | exchange' },
        ],
    },
    {
        code: 'newsletter.confirm',
        name: 'Newsletter confirmation',
        description: 'Sent on subscribe to confirm the email address.',
        variables: [
            { name: 'urls.confirm', description: 'Confirmation link' },
        ],
    },
    {
        code: 'newsletter.welcome',
        name: 'Newsletter welcome',
        description: 'Sent after the subscriber confirms.',
        variables: [
            { name: 'urls.unsubscribe', description: 'One-click unsubscribe link' },
        ],
    },
]
