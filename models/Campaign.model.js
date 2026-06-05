import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Campaign — a labeled marketing activity that groups one or more
 * coupons + (later, in Module 7) banners + (later, in Module 6) an
 * email blast. Used for reporting ("how did Black Friday do?") and
 * to scope coupons to a single push.
 *
 * `status` lifecycle:
 *   draft → scheduled (in the future) → active (now) → completed (past)
 *   draft/active → paused (admin can pause/unpause)
 *
 * The status is admin-driven on the form; we don't auto-promote
 * 'scheduled' to 'active' at startsAt — the admin reviews and flips
 * it (or a future cron job can do so).
 */
const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },

    type: {
        type: String,
        enum: ['promo', 'email', 'banner', 'mixed'],
        default: 'promo',
    },

    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },

    status: {
        type: String,
        enum: ['draft', 'scheduled', 'active', 'paused', 'completed'],
        default: 'draft',
        index: true,
    },

    targeting: {
        allCustomers: { type: Boolean, default: true },
        customerGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup' }],
        firstOrderOnly: { type: Boolean, default: false },
    },

    coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],

    // Manual analytics snapshot — the admin / a future job updates
    // these. Lets the list view show ROI without an aggregation.
    metrics: {
        audienceSize: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        redeemed: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

campaignSchema.index({ startsAt: 1, endsAt: 1 })

campaignSchema.plugin(softDeletePlugin)

const CampaignModel = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema, 'campaigns')
export default CampaignModel
