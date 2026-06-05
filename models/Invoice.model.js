import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Invoice metadata. The PDF itself lives in Cloudinary; this row
 * tracks the number + URL + issued date so the customer can re-fetch
 * it from /account/orders/[id]/invoice.
 *
 * Tax breakdown is stored on the parent Order, not duplicated here.
 */
const invoiceSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
        index: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    pdfUrl: { type: String, default: null },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    issuedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

invoiceSchema.plugin(softDeletePlugin)

const InvoiceModel = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema, 'invoices')
export default InvoiceModel
