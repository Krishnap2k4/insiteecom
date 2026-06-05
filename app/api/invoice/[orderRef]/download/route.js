import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { ensureInvoiceForOrder } from '@/lib/invoices'
import { renderInvoicePdf } from '@/lib/invoicePdf'
import { logger } from '@/lib/logger'
import OrderModel from '@/models/Order.model'
import InvoiceModel from '@/models/Invoice.model'
import PaymentModel from '@/models/Payment.model'

export const runtime = 'nodejs'

/**
 * GET /api/invoice/[orderRef]/download
 *   orderRef may be the order's orderNumber, legacy order_id, or
 *   Mongo _id. Returns the official invoice PDF as a download.
 *
 * Authorization rules:
 *   - Admins (role=admin) can download any order's invoice.
 *   - Customers (role=user) can download only their own order.
 *   - Guests with a `cart_token` cookie matching the order's stored
 *     `guestToken` can download that order's invoice.
 *
 * An order with `paymentStatus != 'paid'` (and not partially refunded)
 * has no official invoice yet — we 400 with a clear message.
 */
const resolveCaller = async () => {
    const cookieStore = await cookies()
    const access = cookieStore.get('access_token')
    if (access?.value) {
        try {
            const { payload } = await jwtVerify(
                access.value,
                new TextEncoder().encode(process.env.SECRET_KEY)
            )
            if (payload?._id && (payload?.role === 'admin' || payload?.role === 'user')) {
                return { userId: payload._id, role: payload.role }
            }
        } catch (err) {
            logger.debug('invoice: jwt verify failed', { error: err?.message })
        }
    }
    const guestToken = cookieStore.get('cart_token')?.value || null
    return { userId: null, role: 'guest', guestToken }
}

const canAccess = (caller, order) => {
    if (caller.role === 'admin') return true
    if (caller.role === 'user' && order.user && String(order.user) === String(caller.userId)) return true
    if (caller.role === 'guest' && caller.guestToken && order.guestToken && caller.guestToken === order.guestToken) return true
    return false
}

export async function GET(_request, { params }) {
    try {
        await connectDB()
        const { orderRef } = await params
        if (!orderRef) return response(false, 404, 'Order not found.')

        const or = [{ orderNumber: orderRef.toUpperCase() }, { order_id: orderRef }]
        if (/^[0-9a-fA-F]{24}$/.test(orderRef)) or.push({ _id: orderRef })
        const order = await OrderModel.findOne({ $or: or, deletedAt: null }).lean()
        if (!order) return response(false, 404, 'Order not found.')

        const caller = await resolveCaller()
        if (!canAccess(caller, order)) return response(false, 403, 'Forbidden.')

        if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'partially_refunded' && order.paymentStatus !== 'refunded') {
            return response(false, 400, 'No invoice is available yet — payment has not been captured.')
        }

        // Find-or-create the Invoice row, then render the PDF.
        let invoice = await InvoiceModel.findOne({ order: order._id, deletedAt: null }).lean()
        if (!invoice) invoice = await ensureInvoiceForOrder(order)
        if (!invoice) return response(false, 500, 'Could not allocate invoice.')

        const payments = await PaymentModel
            .find({ order: order._id, deletedAt: null })
            .sort({ createdAt: 1 })
            .lean()

        const pdf = await renderInvoicePdf({ order, invoice, payments })

        return new Response(pdf, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
                'Cache-Control': 'private, max-age=0, no-cache',
                'Content-Length': String(pdf.length),
            },
        })
    } catch (error) {
        return catchError(error)
    }
}
