import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { RATE_LIMITS, rateLimit } from '@/lib/rateLimit'
import { sendOrderConfirmation } from '@/lib/orderEmails'
import { ensureInvoiceForOrder } from '@/lib/invoices'
import { resolveCoupon, recordCouponRedemption } from '@/lib/coupons'
import { emitNotification, emitAdminBroadcast } from '@/lib/notifications'
import { logger } from '@/lib/logger'
import { resolveCartOwner, findOrCreateCart, hydrateCartItems, cartTotals, GUEST_COOKIE } from '@/lib/cart'
import { buildOrderNumber, recordOrderStatus } from '@/lib/orders'
import { deriveLegacyOrderStatus } from '@/lib/utils'
import OrderModel from '@/models/Order.model'
import PaymentModel from '@/models/Payment.model'
import AddressModel from '@/models/Address.model'
import InventoryModel from '@/models/Inventory.model'
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils'
import { z } from 'zod'

/**
 * Address comes in EITHER as a saved-address id (`addressId`) OR as an
 * ad-hoc inline address. Either way we snapshot it onto the order so
 * it never drifts later.
 */
const inlineAddressSchema = z.object({
    fullName: z.string().trim().min(1),
    phone: z.string().trim().min(7),
    line1: z.string().trim().min(1),
    line2: z.string().trim().optional().default(''),
    landmark: z.string().trim().optional().default(''),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().min(1),
    pincode: z.string().trim().min(3),
})

/**
 * `paymentMethod` selects the flow:
 *   - 'razorpay' → require all three razorpay_* tokens, verify signature
 *   - 'cod'      → no gateway tokens; order opens with paymentStatus 'pending'
 *
 * The Razorpay fields are validated as a group inside the handler so we
 * can emit a clearer error than three separate Zod failures.
 */
const bodySchema = z.object({
    email: z.string().email(),
    addressId: z.string().min(1).optional(),
    shippingAddress: inlineAddressSchema.optional(),
    customerNote: z.string().optional().default(''),
    couponCode: z.string().trim().optional().nullable().default(null),
    couponDiscountAmount: z.number().nonnegative().optional().default(0),
    paymentMethod: z.enum(['razorpay', 'cod']).default('razorpay'),
    razorpay_payment_id: z.string().min(3).optional(),
    razorpay_order_id: z.string().min(3).optional(),
    razorpay_signature: z.string().min(3).optional(),
})

export async function POST(request) {
    const limited = rateLimit(request, { name: 'payment.save-order', ...RATE_LIMITS.PAYMENT })
    if (limited) return limited

    try {
        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        if (data.paymentMethod === 'razorpay' && !(data.razorpay_payment_id && data.razorpay_order_id && data.razorpay_signature)) {
            return response(false, 400, 'Razorpay tokens are required for online payment.')
        }

        const owner = await resolveCartOwner()
        const cart = await findOrCreateCart(owner)
        const items = await hydrateCartItems(cart)
        if (items.length === 0) return response(false, 400, 'Cart is empty.')
        if (items.some((i) => i.unavailable)) {
            return response(false, 400, 'One or more items in your cart are unavailable.')
        }

        // ---- Resolve shipping address into a snapshot ----
        let snapshot = null
        if (data.addressId && owner.userId) {
            const addr = await AddressModel
                .findOne({ _id: data.addressId, user: owner.userId, deletedAt: null })
                .lean()
            if (addr) {
                snapshot = {
                    fullName: addr.fullName || '',
                    phone: addr.phone || '',
                    line1: addr.line1 || '',
                    line2: addr.line2 || '',
                    landmark: addr.landmark || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    country: addr.country || '',
                    pincode: addr.pincode || '',
                    sourceAddressId: addr._id,
                }
            }
        }
        if (!snapshot && data.shippingAddress) {
            snapshot = { ...data.shippingAddress, sourceAddressId: null }
        }
        if (!snapshot) return response(false, 400, 'Shipping address is required.')

        // ---- Compute totals server-side ----
        // We re-validate the coupon code here even though the client
        // already saw it via /api/coupon/apply. The client value is a
        // hint; if it's been tampered with, the server's resolveCoupon
        // recomputes the real discount.
        const totals = cartTotals(items)
        let appliedCoupon = null
        let couponDiscountAmount = 0
        if (data.couponCode) {
            const cr = await resolveCoupon({
                code: data.couponCode,
                cartItems: items,
                userId: owner.userId,
                subtotalHint: totals.subtotal,
            })
            if (!cr.ok) return response(false, 400, cr.reason || 'Coupon is no longer valid.')
            appliedCoupon = cr.coupon
            couponDiscountAmount = cr.discountAmount
        }
        const totalAmount = Math.max(0, totals.subtotal - couponDiscountAmount)
        if (totalAmount <= 0) return response(false, 400, 'Order total must be greater than zero.')

        // ---- Verify Razorpay signature (online flow only) ----
        const isOnline = data.paymentMethod === 'razorpay'
        const verified = isOnline
            ? validatePaymentVerification(
                { order_id: data.razorpay_order_id, payment_id: data.razorpay_payment_id },
                data.razorpay_signature,
                process.env.RAZORPAY_KEY_SECRET
            )
            : true

        // ---- Build order line items from hydrated cart ----
        const orderItems = items.map((it) => {
            const lineSubtotal = Number(it.sellingPrice) * it.qty
            return {
                product: it.productId,
                variant: it.variantId,
                name: it.name,
                sku: it.sku || '',
                image: it.media || '',
                optionValuesSnapshot: (it.optionValues || []).map((o) => ({ name: o.name, value: o.value })),
                qty: it.qty,
                mrp: Number(it.mrp),
                sellingPrice: Number(it.sellingPrice),
                lineSubtotal,
                discount: 0,
                tax: 0,
                lineTotal: lineSubtotal,
            }
        })

        // For COD the order opens with `paymentStatus=pending` — the
        // admin flips it to `paid` once the cash is collected.
        let paymentStatus
        let fulfillmentStatus
        if (isOnline) {
            paymentStatus = verified ? 'paid' : 'failed'
            fulfillmentStatus = verified ? 'unfulfilled' : 'cancelled'
        } else {
            paymentStatus = 'pending'
            fulfillmentStatus = 'unfulfilled'
        }

        // ---- Build order (retry once if orderNumber collision) ----
        let order = null
        for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
            try {
                order = await OrderModel.create({
                    orderNumber: buildOrderNumber(),
                    user: owner.userId || null,
                    guestToken: owner.userId ? null : (owner.guestToken || null),
                    email: data.email,
                    items: orderItems,
                    shippingAddress: snapshot,
                    billingAddress: snapshot,
                    subtotal: totals.subtotal,
                    discount: totals.discount,
                    couponCode: data.couponCode ? data.couponCode.trim().toUpperCase() : null,
                    couponDiscountAmount,
                    taxAmount: 0,
                    shippingAmount: 0,
                    totalAmount,
                    currency: cart.currency || 'INR',
                    paymentStatus,
                    fulfillmentStatus,
                    status: deriveLegacyOrderStatus({ paymentStatus, fulfillmentStatus }),
                    paymentMethod: data.paymentMethod,
                    channel: 'web',
                    customerNote: data.customerNote || '',
                    // legacy mirrors so old admin views still render
                    name: snapshot.fullName,
                    phone: snapshot.phone,
                    country: snapshot.country,
                    state: snapshot.state,
                    city: snapshot.city,
                    pincode: snapshot.pincode,
                    landmark: snapshot.landmark,
                    ordernote: data.customerNote || '',
                    payment_id: isOnline ? data.razorpay_payment_id : null,
                    order_id: isOnline ? data.razorpay_order_id : null,
                })
            } catch (err) {
                if (err?.code === 11000 && err?.keyPattern?.orderNumber) continue
                throw err
            }
        }
        if (!order) return response(false, 500, 'Could not allocate order number.')

        // ---- Payment record + history ----
        const payment = await PaymentModel.create({
            order: order._id,
            gateway: isOnline ? 'razorpay' : 'cod',
            gatewayOrderId: isOnline ? data.razorpay_order_id : null,
            gatewayPaymentId: isOnline ? data.razorpay_payment_id : null,
            amount: totalAmount,
            currency: cart.currency || 'INR',
            status: isOnline ? (verified ? 'captured' : 'failed') : 'created',
            signatureVerified: isOnline ? verified : false,
            failureReason: isOnline && !verified ? 'Signature verification failed' : null,
            capturedAt: isOnline && verified ? new Date() : null,
        })

        const paymentNote = isOnline
            ? (verified ? 'Payment captured (signature verified)' : 'Signature mismatch on save')
            : 'Cash on delivery — payment pending collection'
        const fulfillmentNote = isOnline
            ? (verified ? 'Order created' : 'Order auto-cancelled due to payment failure')
            : 'Order created — awaiting delivery & cash collection'

        await recordOrderStatus({
            order: order._id,
            statusType: 'payment',
            toStatus: paymentStatus,
            note: paymentNote,
            actor: owner.userId || null,
            actorRole: 'system',
        })
        await recordOrderStatus({
            order: order._id,
            statusType: 'fulfillment',
            toStatus: fulfillmentStatus,
            note: fulfillmentNote,
            actorRole: 'system',
        })

        // ---- Reserve inventory ----
        // COD orders reserve too — the customer has committed to the
        // purchase, so we shouldn't let another shopper grab the unit.
        const shouldReserve = isOnline ? verified : true
        if (shouldReserve) {
            for (const it of orderItems) {
                try {
                    await InventoryModel.updateOne(
                        { variant: it.variant, warehouse: 'default', deletedAt: null },
                        { $inc: { reserved: it.qty } }
                    )
                } catch (err) {
                    logger.warn('inventory reservation failed', { variant: String(it.variant), error: err?.message })
                }
            }
        }

        // ---- Clear cart on success ----
        cart.items = []
        cart.couponCode = null
        await cart.save()

        // ---- Issue official invoice on capture (online flow only;
        //      COD waits for cash collection). ----
        if (isOnline && verified) {
            await ensureInvoiceForOrder(order.toObject ? order.toObject() : order)
        }

        // ---- Record coupon redemption + bump usageCount. Only when
        //      the order actually moves forward — failed online orders
        //      don't burn a redemption. ----
        const orderCommitted = isOnline ? verified : true
        if (orderCommitted && appliedCoupon) {
            try {
                await recordCouponRedemption({
                    coupon: appliedCoupon,
                    code: appliedCoupon.code,
                    user: owner.userId,
                    guestEmail: owner.userId ? null : data.email,
                    order,
                    discountAmount: couponDiscountAmount,
                    currency: cart.currency || 'INR',
                })
            } catch (err) {
                logger.warn('coupon redemption write failed', { order: String(order._id), error: err?.message })
            }
        }

        // ---- Send confirmation email (best-effort) ----
        sendOrderConfirmation(order.toObject ? order.toObject() : order).catch((err) =>
            logger.warn('order confirmation email failed', { order: String(order._id), error: err?.message })
        )

        // ---- In-app notifications (best-effort) ----
        if (owner.userId) {
            emitNotification({
                user: owner.userId,
                type: 'order',
                title: `Order ${order.orderNumber} confirmed`,
                body: isOnline
                    ? 'Your payment was successful — we are preparing your order.'
                    : 'Please keep the cash ready on delivery.',
                actionUrl: `/order-details/${order.orderNumber}`,
                entityType: 'Order',
                entityId: order._id,
            })
        }
        emitAdminBroadcast({
            type: 'order',
            title: 'New order placed',
            body: `${order.orderNumber} · ${data.email}`,
            actionUrl: `/admin/orders/details/${order.orderNumber}`,
            entityType: 'Order',
            entityId: order._id,
        })

        const res = response(true, 200, 'Order placed successfully.', {
            orderNumber: order.orderNumber,
            orderId: String(order._id),
            paymentStatus,
            paymentMethod: data.paymentMethod,
            paymentId: String(payment._id),
        })

        // Burn the guest cookie now that the cart was used
        if (!owner.userId) {
            res.cookies.set(GUEST_COOKIE, '', {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 0,
            })
        }
        return res
    } catch (error) {
        return catchError(error)
    }
}
