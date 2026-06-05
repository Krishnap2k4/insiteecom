import PDFDocument from 'pdfkit'

/**
 * Render an order's invoice to a PDF buffer. Streamed via pdfkit so
 * we never write to disk — the route hands the buffer straight to the
 * browser. Layout is intentionally simple and printer-friendly: the
 * brand row + invoice meta + bill-to / ship-to + items table +
 * summary + footer.
 *
 * Returns: Promise<Buffer>
 */
const formatINR = (value, currency = 'INR') =>
    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency })

const brandName = () => process.env.NEXT_PUBLIC_BRAND_NAME || 'E-store'
const brandAddress = () => process.env.NEXT_PUBLIC_BRAND_ADDRESS || ''
const brandGstin = () => process.env.NEXT_PUBLIC_BRAND_GSTIN || ''

export const renderInvoicePdf = ({ order, invoice, payments = [] }) =>
    new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 })
            const chunks = []
            doc.on('data', (c) => chunks.push(c))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)

            // ---- Header band ----
            doc.fontSize(20).fillColor('#111827').text(brandName(), { align: 'left' })
            if (brandAddress()) doc.fontSize(9).fillColor('#6b7280').text(brandAddress())
            if (brandGstin()) doc.fontSize(9).fillColor('#6b7280').text(`GSTIN: ${brandGstin()}`)

            doc.moveTo(40, doc.y + 6).lineTo(555, doc.y + 6).strokeColor('#e5e7eb').stroke()
            doc.moveDown(1)

            // ---- Invoice meta (right aligned) ----
            const metaTop = doc.y
            doc.fontSize(18).fillColor('#111827').text('INVOICE', 40, metaTop, { align: 'right' })
            doc.fontSize(10).fillColor('#374151')
            doc.text(`Invoice #: ${invoice.invoiceNumber}`, 40, doc.y + 4, { align: 'right' })
            doc.text(`Issued: ${new Date(invoice.issuedAt || invoice.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, { align: 'right' })
            doc.text(`Order #: ${order.orderNumber || order.order_id || String(order._id)}`, { align: 'right' })
            doc.text(`Placed: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, { align: 'right' })

            doc.moveDown(1.5)

            // ---- Bill to / Ship to ----
            const addrTop = doc.y
            const addr = order.shippingAddress?.line1 ? order.shippingAddress : {
                fullName: order.name || '', phone: order.phone || '',
                line1: '', line2: '', landmark: order.landmark || '',
                city: order.city || '', state: order.state || '',
                country: order.country || '', pincode: order.pincode || '',
            }

            doc.fontSize(9).fillColor('#9ca3af').text('BILL TO', 40, addrTop)
            doc.fontSize(11).fillColor('#111827').text(addr.fullName || order.email || '—', 40, doc.y + 2)
            doc.fontSize(10).fillColor('#374151').text(order.email || '', 40, doc.y + 2)

            doc.fontSize(9).fillColor('#9ca3af').text('SHIP TO', 300, addrTop)
            doc.fontSize(11).fillColor('#111827').text(addr.fullName || '—', 300, addrTop + 12)
            const shipLines = [
                [addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', '),
                `${addr.city || ''}${addr.state ? ', ' + addr.state : ''} ${addr.pincode || ''}`.trim(),
                addr.country,
                addr.phone,
            ].filter(Boolean)
            doc.fontSize(10).fillColor('#374151')
            let shipY = addrTop + 28
            for (const line of shipLines) {
                doc.text(line, 300, shipY, { width: 255 })
                shipY = doc.y + 2
            }

            doc.y = Math.max(doc.y, shipY) + 12

            // ---- Items table ----
            const tableTop = doc.y
            doc.fontSize(9).fillColor('#ffffff')
            doc.rect(40, tableTop, 515, 22).fill('#111827')
            doc.fillColor('#ffffff')
                .text('Item', 48, tableTop + 7, { width: 270 })
                .text('Qty', 320, tableTop + 7, { width: 40, align: 'right' })
                .text('Unit price', 365, tableTop + 7, { width: 80, align: 'right' })
                .text('Line total', 460, tableTop + 7, { width: 90, align: 'right' })

            doc.y = tableTop + 26
            doc.fontSize(10).fillColor('#111827')

            const items = order.items?.length > 0
                ? order.items
                : (order.products || []).map((p) => ({
                    name: p.name,
                    qty: p.qty,
                    sellingPrice: p.sellingPrice,
                    lineTotal: (p.sellingPrice || 0) * (p.qty || 0),
                    sku: '',
                    optionValuesSnapshot: [],
                }))

            const currency = order.currency || 'INR'
            for (const it of items) {
                const rowTop = doc.y
                doc.fillColor('#111827').text(it.name || 'Item', 48, rowTop, { width: 270 })
                let metaLines = []
                if (it.optionValuesSnapshot?.length) {
                    metaLines.push(it.optionValuesSnapshot.map((o) => `${o.name}: ${o.value}`).join(' · '))
                }
                if (it.sku) metaLines.push(`SKU: ${it.sku}`)
                if (metaLines.length) {
                    doc.fontSize(8).fillColor('#6b7280').text(metaLines.join('  •  '), 48, doc.y, { width: 270 })
                    doc.fontSize(10).fillColor('#111827')
                }
                const lineTotal = it.lineTotal != null ? it.lineTotal : (Number(it.sellingPrice) * (it.qty || 0))
                doc.text(String(it.qty || 0), 320, rowTop, { width: 40, align: 'right' })
                doc.text(formatINR(it.sellingPrice, currency), 365, rowTop, { width: 80, align: 'right' })
                doc.text(formatINR(lineTotal, currency), 460, rowTop, { width: 90, align: 'right' })

                doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).strokeColor('#f3f4f6').stroke()
                doc.y = doc.y + 8
            }

            doc.moveDown(0.5)

            // ---- Summary block (right column) ----
            const summary = []
            summary.push(['Subtotal', formatINR(order.subtotal, currency)])
            if (order.discount > 0) summary.push(['Item discount', `- ${formatINR(order.discount, currency)}`])
            if (order.couponDiscountAmount > 0) summary.push([`Coupon${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${formatINR(order.couponDiscountAmount, currency)}`])
            if (order.taxAmount > 0) summary.push(['Tax', formatINR(order.taxAmount, currency)])
            if (order.shippingAmount > 0) summary.push(['Shipping', formatINR(order.shippingAmount, currency)])

            const sumX = 340
            const sumW = 215
            for (const [label, value] of summary) {
                doc.fontSize(10).fillColor('#6b7280').text(label, sumX, doc.y, { width: 120 })
                doc.fillColor('#111827').text(value, sumX + 120, doc.y - 12, { width: sumW - 120, align: 'right' })
                doc.y = doc.y + 4
            }
            doc.moveTo(sumX, doc.y + 4).lineTo(sumX + sumW, doc.y + 4).strokeColor('#111827').lineWidth(1).stroke()
            doc.y += 8
            doc.fontSize(12).fillColor('#111827').text('Total', sumX, doc.y, { width: 120, continued: false })
            doc.text(formatINR(order.totalAmount, currency), sumX + 120, doc.y - 14, { width: sumW - 120, align: 'right' })

            doc.moveDown(2)

            // ---- Payment + status info ----
            const paymentMethodLabel = order.paymentMethod === 'cod'
                ? 'Cash on delivery'
                : (order.paymentMethod || 'razorpay').toUpperCase()
            doc.fontSize(9).fillColor('#9ca3af').text('PAYMENT', 40, doc.y)
            doc.fontSize(10).fillColor('#111827').text(`Method: ${paymentMethodLabel}`, 40, doc.y + 2)
            doc.text(`Status: ${(order.paymentStatus || 'pending').replace('_', ' ')}`, 40, doc.y + 2)
            if (payments?.length > 0) {
                const captured = payments.find((p) => p.status === 'captured') || payments[0]
                if (captured?.gatewayPaymentId) {
                    doc.text(`Gateway reference: ${captured.gatewayPaymentId}`, 40, doc.y + 2)
                }
                if (captured?.capturedAt) {
                    doc.text(`Captured at: ${new Date(captured.capturedAt).toLocaleString('en-IN')}`, 40, doc.y + 2)
                }
            }

            // ---- Footer ----
            doc.fontSize(9).fillColor('#9ca3af')
                .text(`This is a computer-generated invoice. Generated on ${new Date().toLocaleString('en-IN')}.`,
                    40, 780, { width: 515, align: 'center' })

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
