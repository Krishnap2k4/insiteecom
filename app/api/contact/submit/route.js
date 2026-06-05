import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { RATE_LIMITS, rateLimit } from '@/lib/rateLimit'
import { emitAdminBroadcast } from '@/lib/notifications'
import ContactSubmissionModel from '@/models/ContactSubmission.model'
import { z } from 'zod'

const bodySchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().transform((s) => s.toLowerCase().trim()),
    phone: z.string().trim().optional().default(''),
    subject: z.string().trim().min(2).max(160).optional().default('General enquiry'),
    message: z.string().trim().min(5).max(5000),
})

/**
 * Public contact form. Rate-limited per IP. Notifies all admins via
 * the in-app bell so the team sees it without a full inbox refresh.
 */
export async function POST(request) {
    const limited = rateLimit(request, { name: 'contact.submit', ...RATE_LIMITS.AUTH_BURST })
    if (limited) return limited

    try {
        await connectDB()
        const payload = await request.json().catch(() => ({}))
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Please check the form and try again.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        const doc = await ContactSubmissionModel.create({
            ...data,
            ip: request.headers.get('x-forwarded-for') || '',
            userAgent: request.headers.get('user-agent') || '',
        })

        emitAdminBroadcast({
            type: 'message',
            title: 'New contact form submission',
            body: `${data.name} — ${data.subject}`,
            actionUrl: `/admin/contacts/${doc._id}`,
            entityType: 'ContactSubmission',
            entityId: doc._id,
        })

        return response(true, 200, "Thanks — we've received your message and will get back to you soon.")
    } catch (error) {
        return catchError(error)
    }
}
