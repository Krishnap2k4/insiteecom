import mongoose from 'mongoose'

/**
 * Singleton settings document — always one row with key:'global'.
 *
 * Defaults are intentionally generic so the same codebase can be reused
 * across many client deployments. Each client populates their own values
 * via the admin CMS without touching code.
 */
const settingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: 'global', unique: true },

        shipping: {
            freeDeliveryThreshold:  { type: Number, default: 999 },
            standardDeliveryCharge: { type: Number, default: 99  },
        },

        branding: {
            siteName:      { type: String, default: 'My Store' },  // shown in titles + admin footer
            logoUrl:       { type: String, default: '' },          // empty → typographic siteName fallback
            logoFooterUrl: { type: String, default: '' },          // optional separate footer logo
            faviconUrl:    { type: String, default: '' },          // empty → falls back to /public/favicon.ico
            tagline:       { type: String, default: '' },          // appears under the wordmark
            description:   { type: String, default: '' },          // footer "About" paragraph
        },

        marquee: {
            enabled: { type: Boolean, default: true },
            items:   { type: [String], default: [] },
        },

        // Home page hero — a carousel of slides. Each slide pairs a
        // background image with an attached product (optional) and its
        // own copy. Empty slides[] hides the hero entirely.
        //
        //   autoplayMs — 0 disables autoplay; otherwise rotates every N ms.
        hero: {
            autoplayMs: { type: Number, default: 5000 },
            // Mixed-typed array so Mongoose preserves every field we send,
            // regardless of which version of the model the dev process has
            // cached. Validation lives in zod (api/admin/settings/route.js),
            // so we're not losing schema enforcement — just immunising the
            // persistence layer against HMR-induced strict-mode strips.
            //
            // Per-slide shape:
            //   { imageUrl, mobileImageUrl, eyebrow, heading, subline,
            //     ctaLabel, ctaHref, productId }
            slides: {
                type: [mongoose.Schema.Types.Mixed],
                default: [],
            },
        },

        sections: {
            testimonials: {
                enabled: { type: Boolean, default: true },
                eyebrow: { type: String,  default: 'Testimonials' },
                heading: { type: String,  default: 'What Our Customers Say' },
                items: {
                    type: [{
                        _id: false,
                        name:     { type: String, required: true },
                        location: { type: String, default: '' },
                        review:   { type: String, required: true },
                        rating:   { type: Number, default: 5, min: 1, max: 5 },
                    }],
                    default: [],
                },
            },
            followUs: {
                enabled:         { type: Boolean, default: true },
                eyebrow:         { type: String,  default: '' },
                heading:         { type: String,  default: 'Follow Us' },
                instagramHandle: { type: String,  default: '' },
                hashtag:         { type: String,  default: '' },
                images:          {
                    type: [{
                        _id: false,
                        url: { type: String, required: true },
                        alt: { type: String, default: '' },
                        href:{ type: String, default: '' },
                    }],
                    default: [],
                },
            },
        },

        social: {
            instagram: { type: String, default: '' },
            facebook:  { type: String, default: '' },
            twitter:   { type: String, default: '' },
            whatsapp:  { type: String, default: '' },  // digits only, used in wa.me/<digits>
            email:     { type: String, default: '' },
            phone:     { type: String, default: '' },  // display string
        },
    },
    { timestamps: true }
)

/**
 * HMR safety: Next.js dev re-evaluates this file on hot reloads, but
 * mongoose.models persists across reloads. If we don't drop the cached
 * model, Mongoose keeps using the *previous* schema and silently strips
 * any newly-added fields from $set updates — so saves succeed but
 * nothing persists. Drop the stale entry in dev so the schema below
 * is the one actually registered.
 */
if (process.env.NODE_ENV !== 'production' && mongoose.models.Settings) {
    delete mongoose.models.Settings
}

const SettingsModel =
    mongoose.models.Settings || mongoose.model('Settings', settingsSchema)

export default SettingsModel
