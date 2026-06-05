import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

const redirectSchema = new mongoose.Schema(
    {
        from: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        to: {
            type: String,
            required: true,
            trim: true,
        },
        statusCode: {
            type: Number,
            enum: [301, 302, 307, 308],
            default: 301,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        reason: {
            type: String,
            trim: true,
        },
        hitCount: {
            type: Number,
            default: 0,
        },
        lastHitAt: {
            type: Date,
        },
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: true }
)

redirectSchema.index({ from: 1, isActive: 1, deletedAt: 1 })
redirectSchema.plugin(softDeletePlugin)

const RedirectModel =
    mongoose.models.Redirect || mongoose.model('Redirect', redirectSchema, 'redirects')

export default RedirectModel
