import { isAuthenticated } from '@/lib/authentication'
import { catchError, response } from '@/lib/helperFunction'
import { interpolate, EVENT_CATALOG } from '@/lib/emailTemplates'
import { z } from 'zod'

const bodySchema = z.object({
    code: z.string().trim().toLowerCase(),
    subject: z.string(),
    body: z.string(),
})

/**
 * Server-side preview. The admin types the template; we render it
 * with sample data drawn from the EVENT_CATALOG's variable examples
 * so the WYSIWYG can show what the customer would actually receive.
 */
const buildSample = (code) => {
    const sample = {
        order: {
            orderNumber: 'ORD-260605-PREVIEW',
            totalAmount: 1499,
            currency: 'INR',
            paymentMethod: 'razorpay',
            paymentStatus: 'paid',
            fulfillmentStatus: 'unfulfilled',
        },
        customer: { name: 'Sample Customer', email: 'customer@example.com' },
        urls: {
            orderDetails: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/order-details/ORD-260605-PREVIEW`,
            confirm: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/newsletter/confirm?token=SAMPLE`,
            unsubscribe: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/newsletter/unsubscribe?token=SAMPLE`,
        },
        shipment: { carrier: 'Delhivery', trackingNumber: 'DLV12345678', trackingUrl: 'https://example.com/track/DLV12345678' },
        refund: { amount: 499, currency: 'INR', reason: 'Customer changed mind' },
        return: { returnNumber: 'RET-260605-PREVIEW', type: 'return', adminNote: '', requestNote: '', status: 'requested' },
        reason: 'Sample reason text',
    }
    return sample
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        const parsed = bodySchema.safeParse(await request.json())
        if (!parsed.success) return response(false, 400, 'Invalid preview request.')
        const { code, subject, body } = parsed.data
        const data = buildSample(code)
        return response(true, 200, 'Rendered.', {
            subject: interpolate(subject, data),
            body: interpolate(body, data),
            sampleData: data,
        })
    } catch (error) {
        return catchError(error)
    }
}
