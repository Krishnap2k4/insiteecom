import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { getSiteSettings, invalidateSettingsCache } from '@/lib/settings'
import SettingsModel from '@/models/Settings.model'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Route handlers are always executed per-request — no HTTP-level caching.
// This is the stable equivalent of `revalidate = 0`.
export const dynamic = 'force-dynamic'

/**
 * Reject URL fields that begin with a script-capable scheme. Prevents
 * stored XSS via the admin panel — e.g. setting social.instagram to
 * "javascript:..." would otherwise execute when a customer clicks it.
 * Allows empty strings and ordinary paths/URLs.
 */
const safeUrl = (max = 500) => z.string()
    .trim()
    .max(max)
    .refine(
        (v) => !v || !/^\s*(javascript|data|vbscript)\s*:/i.test(v),
        { message: 'Unsafe URL scheme.' },
    )

/**
 * Each section is independently optional so the admin UI can save one tab
 * at a time without touching the others. Only sections actually present in
 * the body get $set into the document.
 */
const shippingSchema = z.object({
    freeDeliveryThreshold:  z.number().nonnegative(),
    standardDeliveryCharge: z.number().nonnegative(),
})

const brandingSchema = z.object({
    siteName:      z.string().trim().min(1).max(60).default('My Store'),
    logoUrl:       safeUrl().default(''),
    logoFooterUrl: safeUrl().default(''),
    faviconUrl:    safeUrl().default(''),
    tagline:       z.string().trim().max(200).default(''),
    description:   z.string().trim().max(500).default(''),
})

const marqueeSchema = z.object({
    enabled: z.boolean(),
    // Strip falsy / blank entries before length-check so admins can leave
    // a half-typed row in the UI without getting a confusing 400.
    items: z.preprocess(
        (val) => Array.isArray(val)
            ? val.map((s) => typeof s === 'string' ? s.trim() : '').filter(Boolean)
            : [],
        z.array(z.string()).max(20),
    ),
})

/** One slide in the hero carousel. */
const heroSlideSchema = z.object({
    imageUrl:       safeUrl().default(''),
    mobileImageUrl: safeUrl().default(''),
    eyebrow:        z.string().trim().max(120).default(''),
    heading:        z.string().trim().max(200).default(''),
    subline:        z.string().trim().max(500).default(''),
    ctaLabel:       z.string().trim().max(60).default(''),
    ctaHref:        safeUrl(200).default('/shop'),
    productId:      z.string().trim().max(48).default(''),
})

const heroSchema = z.object({
    autoplayMs: z.preprocess((v) => Number(v) || 0, z.number().int().min(0).max(60000)).default(5000),
    // Strip slides that have neither an image nor a heading — admins can
    // leave a half-typed row without getting a confusing 400.
    slides: z.preprocess(
        (val) => Array.isArray(val)
            ? val.filter((s) => s && (typeof s.imageUrl === 'string' && s.imageUrl.trim() || typeof s.heading === 'string' && s.heading.trim()))
            : [],
        z.array(heroSlideSchema).max(12),
    ).default([]),
})

const sectionsSchema = z.object({
    testimonials: z.object({
        enabled: z.boolean(),
        eyebrow: z.string().trim().max(120).default(''),
        heading: z.string().trim().max(200).default(''),
        // Strip rows where both name AND review are blank so admins can leave
        // a half-typed card in the UI without getting a confusing 400.
        items: z.preprocess(
            (val) => Array.isArray(val)
                ? val.filter((it) => it && typeof it.name === 'string' && it.name.trim() && typeof it.review === 'string' && it.review.trim())
                : [],
            z.array(z.object({
                name:     z.string().trim().min(1).max(80),
                location: z.string().trim().max(80).default(''),
                review:   z.string().trim().min(1).max(800),
                rating:   z.preprocess((v) => Number(v) || 5, z.number().int().min(1).max(5)).default(5),
            })).max(50),
        ).default([]),
    }).optional(),
    followUs: z.object({
        enabled:         z.boolean(),
        eyebrow:         z.string().trim().max(120).default(''),
        heading:         z.string().trim().max(200).default(''),
        instagramHandle: z.string().trim().max(60).default(''),
        hashtag:         z.string().trim().max(40).default(''),
        images: z.preprocess(
            (val) => Array.isArray(val)
                ? val.filter((it) => it && typeof it.url === 'string' && it.url.trim().length > 0)
                : [],
            z.array(z.object({
                url:  safeUrl().refine((v) => v.length > 0, { message: 'URL required.' }),
                alt:  z.string().trim().max(200).default(''),
                href: safeUrl().default(''),
            })).max(24),
        ),
    }).optional(),
})

const socialSchema = z.object({
    instagram: safeUrl().default(''),
    facebook:  safeUrl().default(''),
    twitter:   safeUrl().default(''),
    // Strip non-digits server-side so we always have a clean wa.me-compatible number.
    whatsapp:  z.preprocess((v) => typeof v === 'string' ? v.replace(/\D/g, '') : '', z.string().max(20).default('')),
    email:     z.string().trim().max(200).email().or(z.literal('')).default(''),
    phone:     z.string().trim().max(40).default(''),
})

const bodySchema = z.object({
    shipping: shippingSchema.optional(),
    branding: brandingSchema.optional(),
    marquee:  marqueeSchema.optional(),
    hero:     heroSchema.optional(),
    sections: sectionsSchema.optional(),
    social:   socialSchema.optional(),
})

export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        const settings = await getSiteSettings()
        return response(true, 200, 'Settings fetched.', settings)
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const body = await request.json()
        const parsed = bodySchema.safeParse(body)
        if (!parsed.success) {
            return response(false, 400, 'Invalid settings.', { issues: parsed.error.issues })
        }

        // Build $set with only the sections actually supplied.
        const $set = {}
        for (const [k, v] of Object.entries(parsed.data)) {
            if (v !== undefined) $set[k] = v
        }
        if (Object.keys($set).length === 0) {
            return response(false, 400, 'No fields to update.')
        }

        const updated = await SettingsModel.findOneAndUpdate(
            { key: 'global' },
            { $set },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        ).lean()

        // Defense in depth: confirm Mongoose actually wrote what we sent
        // (catches schema-mismatch bugs that would otherwise silently strip fields).
        for (const k of Object.keys($set)) {
            if (updated?.[k] === undefined) {
                return response(false, 500, `Field "${k}" did not persist. Restart the dev server — the running Mongoose schema is likely stale from HMR.`)
            }
        }

        // Deeper check for array-of-subdoc fields. When the running schema
        // doesn't know about a newly-added array path (HMR drift), Mongoose
        // strips it silently on save — the parent object stays, but the
        // array is gone. Surface that condition with a clear error so the
        // admin knows to restart instead of staring at a phantom save.
        const sentArrays = [
            ['hero.slides',                       $set.hero?.slides,                       'Hero slides'],
            ['marquee.items',                     $set.marquee?.items,                     'Marquee items'],
            ['sections.testimonials.items',       $set.sections?.testimonials?.items,      'Testimonials'],
            ['sections.followUs.images',          $set.sections?.followUs?.images,         'Follow Us images'],
        ]
        for (const [path, sent, label] of sentArrays) {
            if (Array.isArray(sent) && sent.length > 0) {
                const got = path.split('.').reduce((o, p) => o?.[p], updated)
                if (!Array.isArray(got) || got.length !== sent.length) {
                    return response(
                        false, 500,
                        `${label} were not persisted — Mongoose stripped them on save. Restart the dev server so the latest schema is loaded.`,
                    )
                }
            }
        }

        // 1. Clear the in-process settings cache (this Node instance).
        invalidateSettingsCache()
        // 2. Refresh every server-rendered page that depends on settings.
        //    'layout' scope covers the storefront layout (Footer) and every
        //    page rendered under it (home Hero, etc).
        revalidatePath('/', 'layout')

        return response(true, 200, 'Settings saved successfully.', { saved: $set })
    } catch (error) {
        return catchError(error)
    }
}
