import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Public "Contact us" form submission. Lives separately from
 * Conversation so we keep the raw signal even when the admin
 * chooses not to convert it into a ticket. When converted,
 * `conversation` is set + status flips to `in_progress`.
 */
const contactSubmissionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '', trim: true },
    subject: { type: String, default: 'General enquiry', trim: true },
    message: { type: String, required: true, trim: true },

    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'spam'],
        default: 'new',
        index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },

    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

contactSubmissionSchema.plugin(softDeletePlugin)

const ContactSubmissionModel = mongoose.models.ContactSubmission
    || mongoose.model('ContactSubmission', contactSubmissionSchema, 'contactsubmissions')
export default ContactSubmissionModel
