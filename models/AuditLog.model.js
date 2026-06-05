import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        actorRole: {
            type: String,
            enum: ['user', 'admin', 'system'],
            default: 'system',
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        entity: {
            type: String,
            required: true,
            index: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true,
        },
        before: {
            type: mongoose.Schema.Types.Mixed,
        },
        after: {
            type: mongoose.Schema.Types.Mixed,
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
        },
        ip: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
)

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 })

const AuditLogModel =
    mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema, 'auditlogs')

export default AuditLogModel
