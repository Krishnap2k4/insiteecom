import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_CHARGE } from './shipping'

/**
 * Default values for every dynamic config section.
 *
 * Kept intentionally generic so the same codebase can power many client
 * stores — each one customises their copy, logo, social links etc. via
 * the admin CMS without touching code.
 *
 * Lives in its own file (no mongoose / no DB imports) so it can be
 * imported safely from both server code and client components.
 */
export const SITE_SETTINGS_DEFAULTS = {
    shipping: {
        freeDeliveryThreshold:  FREE_DELIVERY_THRESHOLD,
        standardDeliveryCharge: STANDARD_DELIVERY_CHARGE,
    },
    branding: {
        siteName:      'My Store',
        logoUrl:       '',
        logoFooterUrl: '',
        faviconUrl:    '',
        tagline:       '',
        description:   '',
    },
    marquee: {
        enabled: true,
        items: [
            '✦ Free Shipping on Orders Above ₹999',
            '✦ Easy Returns',
            '✦ Secure Checkout',
        ],
    },
    hero: {
        autoplayMs: 5000,
        slides:     [],
    },
    sections: {
        testimonials: {
            enabled: true,
            eyebrow: 'Testimonials',
            heading: 'What Our Customers Say',
            items:   [],
        },
        followUs: {
            enabled:         true,
            eyebrow:         '',
            heading:         'Follow Us',
            instagramHandle: '',
            hashtag:         '',
            images:          [],
        },
    },
    social: {
        instagram: '',
        facebook:  '',
        twitter:   '',
        whatsapp:  '',
        email:     '',
        phone:     '',
    },
}
