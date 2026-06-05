import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Admin-editable email template. Replaces (or rather, overrides) the
 * hardcoded `email/orderEvents.js` templates.
 *
 * Lookup convention:
 *   1. `lib/emailTemplates.renderTemplate(code, data)` queries for a
 *      DB row with matching `code` + `locale` + `isActive=true`.
 *   2. If found, renders subject/body with a small `{{var}}` /
 *      `{{nested.path}}` replacer.
 *   3. If not found, the caller falls back to its hardcoded template.
 *
 * `variables[]` is documentation only — what tokens the editor can
 * type. The renderer doesn't enforce it; missing tokens render as
 * empty strings.
 */
const variableDocSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    example: { type: String, default: '', trim: true },
}, { _id: false })

const emailTemplateSchema = new mongoose.Schema({
    code: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    locale: { type: String, default: 'en', lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isActive: { type: Boolean, default: false, index: true },
    variables: { type: [variableDocSchema], default: [] },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

emailTemplateSchema.index({ code: 1, locale: 1 }, {
    unique: true,
    partialFilterExpression: { deletedAt: null },
})

emailTemplateSchema.plugin(softDeletePlugin)

const EmailTemplateModel = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema, 'emailtemplates')
export default EmailTemplateModel
