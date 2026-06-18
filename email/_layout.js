/**
 * Shared layout used by every transactional email. Keeps the look
 * consistent and lets per-event templates stay small + focused on
 * their copy.
 *
 * Inline CSS only — Gmail/Outlook strip <style> blocks.
 */
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Store'

export const renderEmailLayout = ({
    preheader = '',
    title,
    intro,
    bodyBlocks = [],
    ctaText,
    ctaUrl,
    footnote = `Need help? Reply to this email — we're happy to help.`,
}) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2937;">
<span style="display:none!important;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
${preheader}
</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#111827;padding:24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:0.04em;">${brandName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 12px 32px;">
            <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#111827;">${title}</h2>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;color:#374151;">${intro}</p>
            ${bodyBlocks.join('\n')}
            ${ctaUrl ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="border-radius:6px;background:#111827;">
                  <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                    ${ctaText || 'View order'}
                  </a>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 32px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:16px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">${footnote}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because you placed an order with ${brandName}.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

/**
 * Helpers shared by every template.
 */
export const formatINR = (value, currency = 'INR') =>
    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency })

export const renderItemsTable = (items = [], currency = 'INR') => {
    if (!items.length) return ''
    const rows = items.map((it) => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
                ${it.name || 'Item'}
                ${it.optionValuesSnapshot?.length
                    ? `<div style="font-size:12px;color:#6b7280;">${it.optionValuesSnapshot.map((o) => `${o.name}: ${o.value}`).join(' · ')}</div>`
                    : ''}
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;white-space:nowrap;">
                ${it.qty} × ${formatINR(it.sellingPrice, currency)}
            </td>
        </tr>
    `).join('')
    return `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #f3f4f6;margin-top:8px;">
            ${rows}
        </table>
    `
}

export const renderSummary = (order) => {
    const cur = order.currency || 'INR'
    const lines = []
    lines.push(`<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Subtotal</td><td style="padding:4px 0;font-size:14px;text-align:right;color:#374151;">${formatINR(order.subtotal, cur)}</td></tr>`)
    if (order.couponDiscountAmount > 0) lines.push(`<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Coupon${order.couponCode ? ` (${order.couponCode})` : ''}</td><td style="padding:4px 0;font-size:14px;text-align:right;color:#374151;">- ${formatINR(order.couponDiscountAmount, cur)}</td></tr>`)
    if (order.taxAmount > 0) lines.push(`<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Tax</td><td style="padding:4px 0;font-size:14px;text-align:right;color:#374151;">${formatINR(order.taxAmount, cur)}</td></tr>`)
    if (order.shippingAmount > 0) lines.push(`<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Shipping</td><td style="padding:4px 0;font-size:14px;text-align:right;color:#374151;">${formatINR(order.shippingAmount, cur)}</td></tr>`)
    lines.push(`<tr><td style="padding:8px 0 0 0;font-size:15px;font-weight:600;border-top:1px solid #e5e7eb;color:#111827;">Total</td><td style="padding:8px 0 0 0;font-size:15px;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;color:#111827;">${formatINR(order.totalAmount, cur)}</td></tr>`)
    return `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
            ${lines.join('')}
        </table>
    `
}

export const renderShippingAddress = (address) => {
    if (!address || !address.line1) return ''
    return `
        <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:6px;">
            <p style="margin:0 0 4px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Shipping to</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${address.fullName || ''}</p>
            <p style="margin:2px 0;font-size:13px;color:#4b5563;">
                ${[address.line1, address.line2, address.landmark].filter(Boolean).join(', ')}
            </p>
            <p style="margin:2px 0;font-size:13px;color:#4b5563;">
                ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}
            </p>
            <p style="margin:2px 0;font-size:13px;color:#4b5563;">${address.country || ''}</p>
            ${address.phone ? `<p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">${address.phone}</p>` : ''}
        </div>
    `
}
