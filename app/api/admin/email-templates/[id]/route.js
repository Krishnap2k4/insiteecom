import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import EmailTemplateModel from '@/models/EmailTemplate.model'
import { isValidObjectId } from 'mongoose'
import { EVENT_CATALOG } from '@/lib/emailTemplates'
import { z } from 'zod'

const patchSchema = z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().optional(),
    subject: z.string().trim().min(1).optional(),
    body: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
})

export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')
        const doc = await EmailTemplateModel.findOne({ _id: id, deletedAt: null }).lean()
        if (!doc) return response(false, 404, 'Template not found.')
        const catalog = EVENT_CATALOG.find((e) => e.code === doc.code)
        return response(true, 200, 'Template found.', { template: doc, catalog })
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')
        const parsed = patchSchema.safeParse(await request.json())
        if (!parsed.success) {
            return response(false, 400, 'Invalid update.', { issues: parsed.error.issues })
        }
        const doc = await EmailTemplateModel.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { $set: parsed.data },
            { new: true },
        )
        if (!doc) return response(false, 404, 'Template not found.')
        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'email_template.update', entity: 'EmailTemplate', entityId: doc._id,
            meta: { code: doc.code, isActive: doc.isActive },
        })
        return response(true, 200, 'Template updated.', { isActive: doc.isActive })
    } catch (error) {
        return catchError(error)
    }
}
