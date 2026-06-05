import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { transitionOrderStatus } from '@/lib/orders'
import { sendOrderShipped, sendOrderDelivered } from '@/lib/orderEmails'
import { emitNotification } from '@/lib/notifications'
import OrderModel from '@/models/Order.model'
import ShipmentModel from '@/models/Shipment.model'
import { z } from 'zod'

const createSchema = z.object({
    orderId: z.string().min(8),
    items: z.array(z.object({
        sku: z.string().min(1),
        qty: z.number().int().positive(),
    })).min(1),
    carrier: z.string().optional().default(''),
    trackingNumber: z.string().optional().default(''),
    trackingUrl: z.string().optional().default(''),
    notes: z.string().optional().default(''),
})

const updateSchema = z.object({
    _id: z.string().min(8),
    status: z.enum(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled']).optional(),
    carrier: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
    notes: z.string().optional(),
})

/**
 * POST — create a new Shipment for an order.
 * PUT  — update the carrier/tracking/status of an existing shipment.
 *
 * When the last shipment of an order goes to `delivered`, the order's
 * fulfillmentStatus flips to `fulfilled`. Partial shipments mark
 * `partial`.
 */
export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = createSchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }

        const order = await OrderModel.findById(parsed.data.orderId)
        if (!order) return response(false, 404, 'Order not found.')

        const shipment = await ShipmentModel.create({
            order: order._id,
            items: parsed.data.items,
            carrier: parsed.data.carrier,
            trackingNumber: parsed.data.trackingNumber,
            trackingUrl: parsed.data.trackingUrl,
            notes: parsed.data.notes,
            status: 'pending',
        })

        // First shipment for the order → mark fulfillmentStatus 'partial'
        // (fully fulfilled only when delivered, handled in PUT below).
        if (order.fulfillmentStatus === 'unfulfilled') {
            await transitionOrderStatus({
                orderId: order._id,
                fulfillmentStatus: 'partial',
                note: `Shipment created (${parsed.data.carrier || 'manual'})`,
                actor: auth.userId,
                actorRole: 'admin',
            })
        }

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'order.shipment_created',
            entity: 'Shipment', entityId: shipment._id,
            meta: { orderId: String(order._id) },
        })

        const freshOrder = await OrderModel.findById(order._id).lean()
        if (freshOrder) {
            sendOrderShipped(freshOrder, shipment.toObject ? shipment.toObject() : shipment)
            if (freshOrder.user) {
                emitNotification({
                    user: freshOrder.user,
                    type: 'shipment',
                    title: `Order ${freshOrder.orderNumber} shipped`,
                    body: parsed.data.carrier ? `Via ${parsed.data.carrier}` : 'Your order is on its way',
                    actionUrl: `/order-details/${freshOrder.orderNumber}`,
                    entityType: 'Order',
                    entityId: freshOrder._id,
                })
            }
        }

        return response(true, 200, 'Shipment created.', { shipmentId: String(shipment._id) })
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = updateSchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }

        const shipment = await ShipmentModel.findById(parsed.data._id)
        if (!shipment) return response(false, 404, 'Shipment not found.')

        if (parsed.data.status) {
            shipment.status = parsed.data.status
            if (parsed.data.status === 'in_transit' && !shipment.shippedAt) {
                shipment.shippedAt = new Date()
            }
            if (parsed.data.status === 'delivered' && !shipment.deliveredAt) {
                shipment.deliveredAt = new Date()
            }
        }
        if (parsed.data.carrier !== undefined) shipment.carrier = parsed.data.carrier
        if (parsed.data.trackingNumber !== undefined) shipment.trackingNumber = parsed.data.trackingNumber
        if (parsed.data.trackingUrl !== undefined) shipment.trackingUrl = parsed.data.trackingUrl
        if (parsed.data.notes !== undefined) shipment.notes = parsed.data.notes
        await shipment.save()

        if (parsed.data.status === 'delivered') {
            const remaining = await ShipmentModel.countDocuments({
                order: shipment.order,
                status: { $nin: ['delivered', 'cancelled'] },
                deletedAt: null,
            })
            if (remaining === 0) {
                await transitionOrderStatus({
                    orderId: shipment.order,
                    fulfillmentStatus: 'fulfilled',
                    note: 'All shipments delivered',
                    actor: auth.userId,
                    actorRole: 'admin',
                })
                const deliveredOrder = await OrderModel.findById(shipment.order).lean()
                if (deliveredOrder) {
                    sendOrderDelivered(deliveredOrder)
                    if (deliveredOrder.user) {
                        emitNotification({
                            user: deliveredOrder.user,
                            type: 'order',
                            title: `Order ${deliveredOrder.orderNumber} delivered`,
                            body: 'We hope you love it!',
                            actionUrl: `/order-details/${deliveredOrder.orderNumber}`,
                            entityType: 'Order',
                            entityId: deliveredOrder._id,
                        })
                    }
                }
            }
        }

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'order.shipment_update',
            entity: 'Shipment', entityId: shipment._id,
            meta: { status: parsed.data.status },
        })

        return response(true, 200, 'Shipment updated.', {
            status: shipment.status,
            trackingNumber: shipment.trackingNumber,
        })
    } catch (error) {
        return catchError(error)
    }
}
