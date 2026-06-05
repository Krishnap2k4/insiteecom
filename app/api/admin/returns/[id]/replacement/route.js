import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import { sendOrderShipped } from '@/lib/orderEmails'
import OrderModel from '@/models/Order.model'
import ReturnModel from '@/models/Return.model'
import ShipmentModel from '@/models/Shipment.model'
import { z } from 'zod'

const bodySchema = z.object({
    carrier: z.string().trim().optional().default(''),
    trackingNumber: z.string().trim().optional().default(''),
    trackingUrl: z.string().trim().optional().default(''),
    notes: z.string().trim().optional().default(''),
})

/**
 * Create the replacement shipment for an exchange that has been
 * received. The shipment carries the items from the return (by sku)
 * so it stays linked to the original order. Moves the return into
 * the terminal `replaced` state.
 */
export async function POST(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid request.', { issues: parsed.error.issues })
        }

        const ret = await ReturnModel.findById(id)
        if (!ret) return response(false, 404, 'Return not found.')
        if (ret.type !== 'exchange') {
            return response(false, 400, 'Replacement shipments are only created for exchanges. Issue a refund instead.')
        }
        if (ret.status !== 'received') {
            return response(false, 400, `Can only ship a replacement after the return is received (currently ${ret.status}).`)
        }

        const shipment = await ShipmentModel.create({
            order: ret.order,
            items: ret.items.map((i) => ({ sku: i.sku, qty: i.qty })),
            carrier: parsed.data.carrier,
            trackingNumber: parsed.data.trackingNumber,
            trackingUrl: parsed.data.trackingUrl,
            notes: parsed.data.notes || `Replacement for return ${ret.returnNumber}`,
            status: 'pending',
        })

        ret.status = 'replaced'
        ret.replacementShipment = shipment._id
        ret.completedAt = new Date()
        await ret.save()

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'return.replaced',
            entity: 'Return', entityId: ret._id,
            meta: { shipmentId: String(shipment._id) },
        })

        const order = await OrderModel.findById(ret.order).lean()
        if (order) sendOrderShipped(order, shipment.toObject ? shipment.toObject() : shipment)

        return response(true, 200, 'Replacement shipment created.', {
            shipmentId: String(shipment._id),
            returnStatus: ret.status,
        })
    } catch (error) {
        return catchError(error)
    }
}
