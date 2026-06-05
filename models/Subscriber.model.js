import mongoose from 'mongoose'
import { softDeletePlugin } from '@/lib/softDeletePlugin'

/**
 * Newsletter subscriber.
 *
 * Double opt-in workflow:
 *   1. Customer submits email at the storefront → row created with
 *      `status='subscribed'` and a `verificationToken`. A confirm-
 *      email is sent. Until they click the link `verifiedAt` is null
 *      and outbound newsletters should skip them.
 *   2. They click the link → `verifiedAt` set, `verificationToken`
 *      cleared.
 *   3. They can unsubscribe any time via the one-click `unsubscribeToken`
 *      embedded in every outbound email → `status='unsubscribed'`,
 *      `unsubscribedAt` set.
 *
 * `bounced` / `complained` are reserved for ESP feedback loops in
 * Module 6. Today nothing writes them, but the enum keeps the door
 * open.
 *
 * `user` links the subscription to a logged-in account when the
 * signup happens through an authenticated path (e.g. checkout). Guest
 * signups leave `user=null`.
 */
const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: { type: String, default: '', trim: true },

    source: {
        type: String,
        default: 'footer',
        trim: true,
        // Free-form so the storefront can attribute new sources (popup,
        // checkout, ad campaign id) without a schema change.
    },

    status: {
        type: String,
        enum: ['subscribed', 'unsubscribed', 'bounced', 'complained'],
        default: 'subscribed',
        index: true,
    },

    preferences: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'announcements'],
            default: 'announcements',
        },
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    },

    verificationToken: { type: String, default: null, index: true },
    verifiedAt: { type: Date, default: null },
    unsubscribeToken: { type: String, default: null, index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },

    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true })

subscriberSchema.plugin(softDeletePlugin)

const SubscriberModel = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema, 'subscribers')
export default SubscriberModel
