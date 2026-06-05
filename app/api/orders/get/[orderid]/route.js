import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { isReturnEligible, summarizeReturnableItems } from '@/lib/orders'
import OrderModel from '@/models/Order.model'
import OrderStatusHistoryModel from '@/models/OrderStatusHistory.model'
import PaymentModel from '@/models/Payment.model'
import RefundModel from '@/models/Refund.model'
import ShipmentModel from '@/models/Shipment.model'
import ReturnModel from '@/models/Return.model'
import InvoiceModel from '@/models/Invoice.model'

/**
 * Look up an order by either:
 *   - the new human-friendly orderNumber (ORD-...)
 *   - the legacy Razorpay order_id
 *   - the Mongo _id (admin admin-detail link)
 *
 * Returns the new structured shape, with payments / refunds /
 * shipments / returns / statusHistory side-loaded for the timeline
 * view, plus a `returnable` summary the storefront uses to decide
 * whether to show the "Request return" CTA and to cap qty inputs on
 * the request form.
 */
export async function GET(_request, { params }) {
    try {
        await connectDB()
        const { orderid } = await params
        if (!orderid) return response(false, 404, 'Order not found.')

        const or = [{ orderNumber: orderid.toUpperCase() }, { order_id: orderid }]
        if (/^[0-9a-fA-F]{24}$/.test(orderid)) or.push({ _id: orderid })

        const order = await OrderModel.findOne({ $or: or, deletedAt: null })
            .populate('items.product', 'name slug publicId')
            .lean()
        if (!order) return response(false, 404, 'Order not found.')

        const [payments, refunds, shipments, statusHistory, returns, invoice] = await Promise.all([
            PaymentModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: 1 }).lean(),
            RefundModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: 1 }).lean(),
            ShipmentModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: 1 }).lean(),
            OrderStatusHistoryModel.find({ order: order._id }).sort({ createdAt: 1 }).lean(),
            ReturnModel.find({ order: order._id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
            InvoiceModel.findOne({ order: order._id, deletedAt: null }).lean(),
        ])

        const returnable = summarizeReturnableItems(order, returns)
        const eligible = isReturnEligible(order) && returnable.anyReturnable

        return response(true, 200, 'Order found.', {
            order,
            payments,
            refunds,
            shipments,
            statusHistory,
            returns,
            invoice,
            returnable: {
                ...returnable,
                eligible,
            },
        })
    } catch (error) {
        return catchError(error)
    }
}
