import OrderModel from '@/models/Order.model'

/**
 * Returns `{ ok: true, orderId }` when the user has a fulfilled paid
 * order containing this product (treat as "verified buyer"), or
 * `{ ok: false }` otherwise.
 *
 * We accept paid + partially_refunded + refunded as "had it" states
 * — once a customer received the item they're a verified buyer even
 * if they later refunded.
 */
export const findVerifyingOrder = async ({ userId, productId }) => {
    if (!userId || !productId) return { ok: false }
    const order = await OrderModel.findOne({
        user: userId,
        deletedAt: null,
        paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] },
        fulfillmentStatus: { $in: ['fulfilled', 'partial'] },
        'items.product': productId,
    }).select('_id').lean()
    if (!order) return { ok: false }
    return { ok: true, orderId: order._id }
}
