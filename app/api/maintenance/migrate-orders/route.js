import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { logger } from '@/lib/logger'
import { buildOrderNumber } from '@/lib/orders'
import { deriveLegacyOrderStatus } from '@/lib/utils'
import { ensureInvoiceForOrder } from '@/lib/invoices'
import OrderModel from '@/models/Order.model'
import OrderStatusHistoryModel from '@/models/OrderStatusHistory.model'
import PaymentModel from '@/models/Payment.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import MediaModel from '@/models/Media.model'

/**
 * Idempotent migration for Module 3 (Orders v2):
 *
 *   1. Assign `orderNumber` to every Order that doesn't have one
 *      (preserves the legacy `order_id` for back-compat lookups).
 *
 *   2. Convert the flat legacy address fields (name/phone/city/...)
 *      into a structured `shippingAddress` snapshot. Old fields are
 *      kept so historical exports still work, but new UIs read the
 *      structured one.
 *
 *   3. Map `products[]` (legacy) into the new `items[]` shape with a
 *      best-effort variant snapshot (sku, image, optionValues from
 *      the current variant — if the variant was deleted, falls back
 *      to the legacy product name).
 *
 *   4. Derive `paymentStatus` + `fulfillmentStatus` from the legacy
 *      combined `status` field and save them back.
 *
 *   5. For every order with a `payment_id`, create a Payment row if
 *      one doesn't exist already (status `captured` / `failed` based
 *      on paymentStatus).
 *
 *   6. Seed one `OrderStatusHistory` per migrated order so the
 *      timeline view on the detail page isn't empty for old data.
 */
export async function POST() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()

        const allOrders = await OrderModel
            .find({ deletedAt: null })
            .lean()

        let numbered = 0
        let snapshotted = 0
        let itemsMigrated = 0
        let paymentsSeeded = 0
        let historySeeded = 0
        let statusBackfilled = 0
        let invoicesSeeded = 0
        const errors = []

        for (const o of allOrders) {
            const update = {}
            const orderId = o._id

            // 1. orderNumber
            if (!o.orderNumber) {
                for (let attempt = 0; attempt < 3; attempt += 1) {
                    const candidate = buildOrderNumber(new Date(o.createdAt || Date.now()))
                    const conflict = await OrderModel.exists({ orderNumber: candidate })
                    if (!conflict) { update.orderNumber = candidate; numbered += 1; break }
                }
            }

            // 2. shippingAddress snapshot
            const hasSnapshot = o.shippingAddress && o.shippingAddress.line1
            if (!hasSnapshot && (o.name || o.city || o.phone)) {
                update.shippingAddress = {
                    fullName: o.name || '',
                    phone: o.phone || '',
                    line1: o.landmark || o.city || '',
                    line2: '',
                    landmark: o.landmark || '',
                    city: o.city || '',
                    state: o.state || '',
                    country: o.country || '',
                    pincode: o.pincode || '',
                    sourceAddressId: null,
                }
                update.billingAddress = update.shippingAddress
                update.customerNote = o.ordernote || ''
                snapshotted += 1
            }

            // 3. items[] from legacy products[]
            const hasItems = Array.isArray(o.items) && o.items.length > 0
            if (!hasItems && Array.isArray(o.products) && o.products.length > 0) {
                const variantIds = o.products.map((p) => p.variantId).filter(Boolean)
                const variants = variantIds.length > 0
                    ? await ProductVariantModel
                        .find({ _id: { $in: variantIds } })
                        .populate({ path: 'media', select: 'secure_url', model: MediaModel })
                        .lean()
                    : []
                const variantMap = new Map(variants.map((v) => [String(v._id), v]))

                const items = o.products.map((p) => {
                    const v = variantMap.get(String(p.variantId))
                    const lineSubtotal = Number(p.sellingPrice || 0) * (p.qty || 0)
                    return {
                        product: p.productId,
                        variant: p.variantId,
                        name: p.name || v?.product?.name || 'Item',
                        sku: v?.sku || '',
                        image: v?.media?.[0]?.secure_url || '',
                        optionValuesSnapshot: v?.optionValues || [],
                        qty: p.qty || 1,
                        mrp: Number(p.mrp || 0),
                        sellingPrice: Number(p.sellingPrice || 0),
                        lineSubtotal,
                        discount: 0,
                        tax: 0,
                        lineTotal: lineSubtotal,
                    }
                })
                update.items = items
                itemsMigrated += 1
            }

            // 4. payment / fulfillment status from legacy status
            const needsStatus = !o.paymentStatus || o.paymentStatus === 'pending' || !o.fulfillmentStatus
            if (needsStatus) {
                let ps = 'pending'
                let fs = 'unfulfilled'
                switch (o.status) {
                    case 'delivered': ps = 'paid'; fs = 'fulfilled'; break
                    case 'shipped': ps = 'paid'; fs = 'partial'; break
                    case 'processing': ps = 'paid'; fs = 'unfulfilled'; break
                    case 'cancelled': ps = 'failed'; fs = 'cancelled'; break
                    case 'unverified': ps = 'failed'; fs = 'cancelled'; break
                    case 'pending':
                    default:
                        ps = o.payment_id ? 'paid' : 'pending'
                        fs = 'unfulfilled'
                }
                update.paymentStatus = ps
                update.fulfillmentStatus = fs
                update.status = deriveLegacyOrderStatus({ paymentStatus: ps, fulfillmentStatus: fs })
                statusBackfilled += 1
            }

            // 5. email backfill from legacy email field (already in schema)
            if (!o.email && o.user) {
                // best effort — leave blank if no email; caller can patch later
            }

            // 6. currency default
            if (!o.currency) update.currency = 'INR'

            // 7. paymentMethod backfill — legacy rows didn't carry the
            //    field. We assume any order with a `payment_id` was
            //    razorpay (the only gateway the project ever shipped);
            //    everything else gets COD so the admin can still mark
            //    it cash-collected on delivery.
            if (!o.paymentMethod) {
                update.paymentMethod = o.payment_id ? 'razorpay' : 'cod'
            }

            try {
                if (Object.keys(update).length > 0) {
                    await OrderModel.updateOne({ _id: orderId }, { $set: update })
                }
            } catch (err) {
                errors.push({ orderId: String(orderId), reason: err?.message })
                logger.warn('order migration write failed', { orderId: String(orderId), error: err?.message })
                continue
            }

            // 8. Payment row seeding — Razorpay rows for orders with a
            //    gateway payment id, COD rows for everything else.
            const hasPaymentRow = await PaymentModel.findOne({ order: orderId, deletedAt: null })
            if (!hasPaymentRow) {
                const ps = update.paymentStatus || o.paymentStatus || 'pending'
                const method = update.paymentMethod || o.paymentMethod || (o.payment_id ? 'razorpay' : 'cod')
                if (method === 'razorpay' && o.payment_id) {
                    await PaymentModel.create({
                        order: orderId,
                        gateway: 'razorpay',
                        gatewayOrderId: o.order_id || null,
                        gatewayPaymentId: o.payment_id,
                        amount: o.totalAmount || 0,
                        currency: o.currency || 'INR',
                        status: ps === 'paid' ? 'captured' : (ps === 'failed' ? 'failed' : 'created'),
                        signatureVerified: ps === 'paid',
                        capturedAt: ps === 'paid' ? (o.createdAt || new Date()) : null,
                    })
                    paymentsSeeded += 1
                } else if (method === 'cod') {
                    await PaymentModel.create({
                        order: orderId,
                        gateway: 'cod',
                        amount: o.totalAmount || 0,
                        currency: o.currency || 'INR',
                        status: ps === 'paid' ? 'captured' : 'created',
                        capturedAt: ps === 'paid' ? (o.createdAt || new Date()) : null,
                    })
                    paymentsSeeded += 1
                }
            }

            // 9. Status history seed
            const histExists = await OrderStatusHistoryModel.findOne({ order: orderId })
            if (!histExists) {
                const ps = update.paymentStatus || o.paymentStatus || 'pending'
                const fs = update.fulfillmentStatus || o.fulfillmentStatus || 'unfulfilled'
                await OrderStatusHistoryModel.create({
                    order: orderId,
                    statusType: 'order',
                    fromStatus: null,
                    toStatus: o.status || 'pending',
                    note: 'Order migrated from legacy schema',
                    actorRole: 'system',
                })
                await OrderStatusHistoryModel.create({
                    order: orderId,
                    statusType: 'payment',
                    fromStatus: null,
                    toStatus: ps,
                    note: 'Payment status inferred from legacy data',
                    actorRole: 'system',
                })
                await OrderStatusHistoryModel.create({
                    order: orderId,
                    statusType: 'fulfillment',
                    fromStatus: null,
                    toStatus: fs,
                    note: 'Fulfillment status inferred from legacy data',
                    actorRole: 'system',
                })
                historySeeded += 1
            }

            // 10. Seed Invoice row for orders whose final paymentStatus
            //     ended up as 'paid'. The PDF itself is generated on
            //     demand at download time — this row only carries the
            //     official number + total + issued-at.
            const finalPs = update.paymentStatus || o.paymentStatus || 'pending'
            if (finalPs === 'paid') {
                const ordSnapshot = { ...o, ...update, _id: orderId }
                const inv = await ensureInvoiceForOrder(ordSnapshot)
                if (inv && inv.createdAt && new Date(inv.createdAt).getTime() > Date.now() - 60_000) {
                    invoicesSeeded += 1
                }
            }
        }

        const summary = {
            ordersScanned: allOrders.length,
            orderNumbersAssigned: numbered,
            addressSnapshotsCreated: snapshotted,
            itemsMigrated,
            statusBackfilled,
            paymentsSeeded,
            historySeeded,
            invoicesSeeded,
            errors,
        }
        logger.info('migrate-orders run complete', summary)
        return response(true, 200, 'Order migration complete.', summary)
    } catch (error) {
        return catchError(error)
    }
}
