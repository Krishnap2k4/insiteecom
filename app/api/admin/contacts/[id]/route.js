import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import ContactSubmissionModel from '@/models/ContactSubmission.model'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'

export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const doc = await ContactSubmissionModel
            .findOne({ _id: id, deletedAt: null })
            .populate('conversation', 'subject status')
            .populate('assignedTo', 'name email')
            .lean()
        if (!doc) return response(false, 404, 'Contact submission not found.')
        return response(true, 200, 'Contact found.', doc)
    } catch (error) {
        return catchError(error)
    }
}

const patchSchema = z.object({
    status: z.enum(['new', 'in_progress', 'resolved', 'spam']).optional(),
})

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        if (!isValidObjectId(id)) return response(false, 400, 'Invalid id.')

        const parsed = patchSchema.safeParse(await request.json())
        if (!parsed.success) return response(false, 400, 'Invalid update.')

        const doc = await ContactSubmissionModel.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { $set: parsed.data },
            { new: true },
        )
        if (!doc) return response(false, 404, 'Contact submission not found.')

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'contact.update', entity: 'ContactSubmission', entityId: doc._id,
            meta: parsed.data,
        })
        return response(true, 200, 'Updated.', { status: doc.status })
    } catch (error) {
        return catchError(error)
    }
}
