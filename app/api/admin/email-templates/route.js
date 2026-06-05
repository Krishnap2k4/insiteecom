import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import EmailTemplateModel from '@/models/EmailTemplate.model'
import { EVENT_CATALOG } from '@/lib/emailTemplates'
import { z } from 'zod'

const bodySchema = z.object({
    code: z.string().trim().toLowerCase(),
    name: z.string().trim().min(2),
    description: z.string().trim().optional().default(''),
    locale: z.string().trim().optional().default('en'),
    subject: z.string().trim().min(1),
    body: z.string().min(1),
    isActive: z.boolean().optional().default(false),
})

/**
 * GET — list templates plus the event catalog so the admin UI can
 * show "available events" alongside "edited templates" without an
 * extra round-trip.
 */
export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const sp = request.nextUrl.searchParams
        const start = parseInt(sp.get('start') || 0, 10)
        const size = parseInt(sp.get('size') || 50, 10)
        const globalFilter = sp.get('globalFilter') || ''

        const matchQuery = { deletedAt: null }
        if (globalFilter) {
            matchQuery.$or = [
                { code: { $regex: globalFilter, $options: 'i' } },
                { name: { $regex: globalFilter, $options: 'i' } },
                { subject: { $regex: globalFilter, $options: 'i' } },
            ]
        }

        const data = await EmailTemplateModel
            .find(matchQuery)
            .select('code name locale subject isActive updatedAt')
            .sort({ updatedAt: -1 })
            .skip(start)
            .limit(size)
            .lean()
        const totalRowCount = await EmailTemplateModel.countDocuments(matchQuery)

        return NextResponse.json({
            success: true,
            data,
            meta: { totalRowCount, catalog: EVENT_CATALOG },
        })
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const parsed = bodySchema.safeParse(await request.json())
        if (!parsed.success) {
            return response(false, 400, 'Invalid template.', { issues: parsed.error.issues })
        }
        const data = parsed.data
        // Variable docs come from the catalog so admins don't have to type them.
        const catalog = EVENT_CATALOG.find((e) => e.code === data.code)
        const doc = await EmailTemplateModel.create({
            ...data,
            variables: catalog?.variables || [],
        })
        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'email_template.create', entity: 'EmailTemplate', entityId: doc._id,
            meta: { code: doc.code },
        })
        return response(true, 200, 'Template created.', { _id: String(doc._id) })
    } catch (error) {
        return catchError(error)
    }
}
