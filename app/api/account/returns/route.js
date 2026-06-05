import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { buildReturnNumber, isReturnEligible, summarizeReturnableItems } from '@/lib/orders'
import { sendReturnRequested } from '@/lib/orderEmails'
import { recordAudit } from '@/lib/audit'
import OrderModel from '@/models/Order.model'
import ReturnModel from '@/models/Return.model'
import { z } from 'zod'

/**
 * GET — list this user's returns.
 * POST — create a new return / exchange request against an order
 *        owned by this user.
 */
const itemSchema = z.object({
    sku: z.string().trim().min(1),
    name: z.string().optional().default(''),
    qty: z.number().int().positive(),
    reason: z.string().optional().default(''),
})
const exchangeForSchema = z.object({
    variant: z.string().min(8).optional(),
    sku: z.string().optional().default(''),
    name: z.string().optional().default(''),
    note: z.string().optional().default(''),
})
const createSchema = z.object({
    orderId: z.string().min(8),
    type: z.enum(['return', 'exchange']).default('return'),
    items: z.array(itemSchema).min(1),
    requestNote: z.string().optional().default(''),
    exchangeForVariant: exchangeForSchema.optional(),
})

export async function GET() {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const list = await ReturnModel
            .find({ user: auth.userId, deletedAt: null })
            .populate({ path: 'order', select: 'orderNumber totalAmount currency createdAt' })
            .sort({ createdAt: -1 })
            .lean()

        const shaped = list.map((r) => ({
            _id: String(r._id),
            returnNumber: r.returnNumber,
            type: r.type,
            status: r.status,
            itemCount: r.items?.length || 0,
            createdAt: r.createdAt,
            order: r.order
                ? {
                    _id: String(r.order._id),
                    orderNumber: r.order.orderNumber,
                    totalAmount: r.order.totalAmount,
                    currency: r.order.currency || 'INR',
                    createdAt: r.order.createdAt,
                }
                : null,
        }))
        return response(true, 200, 'Returns fetched.', shaped)
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user')
        if (!auth.isAuth) return response(false, 401, 'Unauthorized.')

        const payload = await request.json()
        const parsed = createSchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }
        const { orderId, type, items, requestNote, exchangeForVariant } = parsed.data

        const order = await OrderModel.findOne({ _id: orderId, user: auth.userId, deletedAt: null })
        if (!order) return response(false, 404, 'Order not found.')
        if (!isReturnEligible(order)) {
            return response(false, 400, 'This order is not eligible for a return at this time.')
        }

        // Compute returnable balance per sku, accounting for active
        // returns. Same helper the storefront uses — server is the
        // authority, so a customer that hand-crafts a POST cannot
        // overlap their own existing returns.
        const existingReturns = await ReturnModel
            .find({ order: order._id, user: auth.userId, deletedAt: null })
            .lean()
        const { bySku, anyReturnable } = summarizeReturnableItems(order, existingReturns)
        if (!anyReturnable) {
            return response(false, 400, 'No returnable items left on this order.')
        }
        for (const it of items) {
            const info = bySku[it.sku]
            if (!info || info.ordered <= 0) {
                return response(false, 400, `Item "${it.sku}" is not part of this order.`)
            }
            if (it.qty > info.available) {
                return response(false, 400, `Only ${info.available} of "${it.sku}" can still be returned.`)
            }
        }

        // Allocate a return number with retry on the unique index.
        let returnDoc = null
        for (let attempt = 0; attempt < 3 && !returnDoc; attempt += 1) {
            try {
                returnDoc = await ReturnModel.create({
                    returnNumber: buildReturnNumber(),
                    order: order._id,
                    user: auth.userId,
                    type,
                    items,
                    requestNote,
                    exchangeForVariant: type === 'exchange' && exchangeForVariant ? exchangeForVariant : null,
                    status: 'requested',
                })
            } catch (err) {
                if (err?.code === 11000 && err?.keyPattern?.returnNumber) continue
                throw err
            }
        }
        if (!returnDoc) return response(false, 500, 'Could not allocate return number.')

        recordAudit({
            actor: auth.userId, actorRole: 'customer',
            action: 'return.requested',
            entity: 'Return', entityId: returnDoc._id,
            meta: { orderId: String(order._id), type, items: items.map((i) => i.sku) },
        })

        sendReturnRequested(returnDoc.toObject(), order.toObject())

        return response(true, 200, 'Return request submitted.', {
            returnId: String(returnDoc._id),
            returnNumber: returnDoc.returnNumber,
        })
    } catch (error) {
        return catchError(error)
    }
}
