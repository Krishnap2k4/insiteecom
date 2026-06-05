import InvoiceModel from '@/models/Invoice.model'
import { buildInvoiceNumber } from '@/lib/orders'
import { logger } from '@/lib/logger'

/**
 * Find-or-create the Invoice row for an order. Idempotent — every
 * payment-capture site calls this without worrying whether an invoice
 * already exists. The PDF itself is generated on demand at download
 * time (see `lib/invoicePdf.js`); this row just holds the number,
 * total, and issued-at timestamp.
 *
 * Caller is expected to pass a plain (lean or hydrated) order doc;
 * we touch the DB only for the upsert.
 */
export const ensureInvoiceForOrder = async (order) => {
    if (!order || !order._id) return null
    const existing = await InvoiceModel.findOne({ order: order._id, deletedAt: null }).lean()
    if (existing) return existing

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const doc = await InvoiceModel.create({
                order: order._id,
                invoiceNumber: buildInvoiceNumber(new Date(order.createdAt || Date.now())),
                total: order.totalAmount || 0,
                currency: order.currency || 'INR',
                issuedAt: new Date(),
            })
            return doc.toObject()
        } catch (err) {
            // Two concurrent capture paths could race for the same
            // (order, invoiceNumber) pair. On duplicate key, re-check
            // the existing row before retrying with a fresh number.
            if (err?.code === 11000) {
                const race = await InvoiceModel.findOne({ order: order._id, deletedAt: null }).lean()
                if (race) return race
                continue
            }
            logger.warn('invoice create failed', { orderId: String(order._id), error: err?.message })
            return null
        }
    }
    return null
}
