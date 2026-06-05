import crypto from 'crypto'
import OrderModel from '@/models/Order.model'
import OrderStatusHistoryModel from '@/models/OrderStatusHistory.model'
import { deriveLegacyOrderStatus } from '@/lib/utils'
import { logger } from '@/lib/logger'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // Crockford — no I/L/O/U

/**
 * Crockford-style 8-char identifier suffix. Used for orderNumber and
 * invoiceNumber to avoid sequential leak + ambiguity-prone chars.
 */
export const randomCrockford = (len = 8) => {
    const bytes = crypto.randomBytes(len)
    let out = ''
    for (let i = 0; i < len; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length]
    return out
}

/**
 * Build a date-stamped order number: ORD-YYMMDD-XXXX (8 random chars).
 * Collision is astronomical at 8 chars; we still retry on unique
 * index error in the caller.
 */
export const buildOrderNumber = (date = new Date()) => {
    const yy = String(date.getUTCFullYear()).slice(-2)
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(date.getUTCDate()).padStart(2, '0')
    return `ORD-${yy}${mm}${dd}-${randomCrockford(8)}`
}

export const buildInvoiceNumber = (date = new Date()) => {
    const yy = String(date.getUTCFullYear()).slice(-2)
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(date.getUTCDate()).padStart(2, '0')
    return `INV-${yy}${mm}${dd}-${randomCrockford(8)}`
}

export const buildReturnNumber = (date = new Date()) => {
    const yy = String(date.getUTCFullYear()).slice(-2)
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(date.getUTCDate()).padStart(2, '0')
    return `RET-${yy}${mm}${dd}-${randomCrockford(8)}`
}

/**
 * Default return window. After this many days from delivery, the
 * customer can no longer request a return/exchange. Configurable via
 * env so a brand with a 30-day policy can set it without code changes.
 */
export const RETURN_WINDOW_DAYS = Number(process.env.RETURN_WINDOW_DAYS || 7)

/**
 * Returns true if the order is currently eligible for a customer-
 * initiated return / exchange.
 *   - Must be fulfilled (delivered)
 *   - Must not be inside the return window (RETURN_WINDOW_DAYS from
 *     the most recent fulfillment-status transition or, if missing,
 *     the order's updatedAt as a fallback).
 *   - Must not be already fully refunded.
 */
export const isReturnEligible = (order) => {
    if (!order) return false
    if (order.fulfillmentStatus !== 'fulfilled') return false
    if (order.paymentStatus === 'refunded') return false
    const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt
    if (!deliveredAt) return false
    const ageMs = Date.now() - new Date(deliveredAt).getTime()
    const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
    return ageMs <= windowMs
}

/**
 * Status values that mean "this return is still consuming the item's
 * returnable balance" — i.e. anything that isn't a terminal failure
 * state. A `cancelled` or `rejected` return frees the items up again.
 */
const ACTIVE_RETURN_STATUSES = new Set([
    'requested', 'approved', 'received', 'refunded', 'replaced',
])

/**
 * Given an order document and the list of its returns, compute how
 * many units of each line item are still returnable, plus per-sku
 * notes about what's already in flight.
 *
 * Used on:
 *   - storefront order detail (decide whether to show "Request return")
 *   - storefront return request page (per-item max qty + disable rows
 *     that have nothing left)
 *
 * Returns: {
 *   bySku: Map<sku, { ordered, inActiveReturns, available, activeRefs: [{returnNumber,status}] }>
 *   anyReturnable: boolean
 *   activeReturns: array of returns blocking new requests
 * }
 */
export const summarizeReturnableItems = (order, returns = []) => {
    const bySku = {}
    for (const it of (order?.items || [])) {
        const sku = String(it.sku || '').trim()
        if (!sku) continue
        if (!bySku[sku]) {
            bySku[sku] = {
                sku,
                name: it.name,
                ordered: 0,
                inActiveReturns: 0,
                available: 0,
                activeRefs: [],
            }
        }
        bySku[sku].ordered += (it.qty || 0)
    }
    const activeReturns = []
    for (const r of returns) {
        const isActive = ACTIVE_RETURN_STATUSES.has(r.status)
        if (!isActive) continue
        activeReturns.push({ _id: String(r._id), returnNumber: r.returnNumber, status: r.status, type: r.type })
        for (const it of (r.items || [])) {
            const sku = String(it.sku || '').trim()
            if (!sku || !bySku[sku]) continue
            bySku[sku].inActiveReturns += (it.qty || 0)
            bySku[sku].activeRefs.push({ returnNumber: r.returnNumber, status: r.status, type: r.type, qty: it.qty })
        }
    }
    for (const sku of Object.keys(bySku)) {
        const row = bySku[sku]
        row.available = Math.max(0, row.ordered - row.inActiveReturns)
    }
    const anyReturnable = Object.values(bySku).some((r) => r.available > 0)
    return { bySku, anyReturnable, activeReturns }
}

/**
 * Record one status-history entry. Fire-and-forget: a logging failure
 * must never block the primary order operation.
 */
export const recordOrderStatus = async ({
    order,
    statusType,
    fromStatus = null,
    toStatus,
    note = '',
    actor = null,
    actorRole = 'system',
}) => {
    if (!order || !statusType || !toStatus) return null
    try {
        return await OrderStatusHistoryModel.create({
            order, statusType, fromStatus, toStatus, note, actor, actorRole,
        })
    } catch (err) {
        logger.error('order status history write failed', { order: String(order), error: err })
        return null
    }
}

/**
 * Apply a status change to the Order document AND record it in the
 * history. Returns the updated order. Skips writes if no change.
 */
export const transitionOrderStatus = async ({
    orderId,
    paymentStatus,
    fulfillmentStatus,
    note = '',
    actor = null,
    actorRole = 'system',
}) => {
    const order = await OrderModel.findById(orderId)
    if (!order) return null

    const fromPayment = order.paymentStatus
    const fromFulfillment = order.fulfillmentStatus
    let changed = false

    if (paymentStatus && paymentStatus !== fromPayment) {
        order.paymentStatus = paymentStatus
        changed = true
        await recordOrderStatus({
            order: order._id,
            statusType: 'payment',
            fromStatus: fromPayment,
            toStatus: paymentStatus,
            note, actor, actorRole,
        })
    }

    if (fulfillmentStatus && fulfillmentStatus !== fromFulfillment) {
        order.fulfillmentStatus = fulfillmentStatus
        changed = true
        await recordOrderStatus({
            order: order._id,
            statusType: 'fulfillment',
            fromStatus: fromFulfillment,
            toStatus: fulfillmentStatus,
            note, actor, actorRole,
        })
    }

    if (changed) {
        order.status = deriveLegacyOrderStatus({
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
        })
        await order.save()
    }

    return order
}
