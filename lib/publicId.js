import crypto from 'crypto'

/**
 * Public-facing short ID for products (and any future entity that
 * needs a stable, URL-friendly identifier).
 *
 * Alphabet is Crockford-style — 30 unambiguous chars (no 0/O/1/I/l).
 * Length 8 gives 30^8 ≈ 656 trillion combinations; collision risk
 * stays negligible into the hundreds of millions of IDs while keeping
 * URLs human-typeable.
 *
 *   /product/blue-cotton-shirt-A8K3F2H1
 *                              ^^^^^^^^
 *                              publicId
 *
 * The slug part can be renamed freely; lookups match on publicId so
 * URLs never break. If the slug part in an incoming URL is stale,
 * the route handler responds with a 301 redirect to the canonical
 * `<currentSlug>-<publicId>` URL.
 */

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
const ALPHABET_LEN = ALPHABET.length

// Largest multiple of ALPHABET_LEN that fits in a byte. Bytes above
// this are rejected so the modulo bias toward earlier chars stays
// zero (rejection sampling).
const MAX_USABLE_BYTE = Math.floor(256 / ALPHABET_LEN) * ALPHABET_LEN

const generateOnce = (length) => {
    const bytes = crypto.randomBytes(length * 2)
    let out = ''
    for (let i = 0; i < bytes.length && out.length < length; i++) {
        const byte = bytes[i]
        if (byte < MAX_USABLE_BYTE) {
            out += ALPHABET[byte % ALPHABET_LEN]
        }
    }
    return out
}

export const generatePublicId = (length = 8) => {
    let id = generateOnce(length)
    // Rejection sampling can rarely leave us short — re-draw if so.
    while (id.length < length) {
        id += generateOnce(length - id.length)
    }
    return id
}

/**
 * Generate a publicId that doesn't collide with any document the
 * caller-supplied `exists(id)` predicate already knows about.
 * Retries up to maxAttempts before giving up.
 *
 *   const id = await generateUniquePublicId(async (candidate) =>
 *     await ProductModel.exists({ publicId: candidate }))
 */
export const generateUniquePublicId = async (exists, { length = 8, maxAttempts = 5 } = {}) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = generatePublicId(length)
        const taken = await exists(candidate)
        if (!taken) return candidate
    }
    throw new Error(`Could not generate unique publicId after ${maxAttempts} attempts`)
}

/**
 * Parse an incoming `<slug>-<publicId>` URL segment.
 *
 *   parseProductSlug('blue-cotton-shirt-A8K3F2H1')
 *     → { slug: 'blue-cotton-shirt', publicId: 'A8K3F2H1' }
 *
 *   parseProductSlug('legacy-slug-only')
 *     → { slug: 'legacy-slug-only', publicId: null }
 *
 * The publicId is detected as the trailing segment after the final
 * hyphen, only if it's an 8-char string drawn entirely from the
 * Crockford alphabet. Otherwise the whole input is treated as a
 * legacy slug so old URLs keep resolving.
 */
const PUBLIC_ID_PATTERN = new RegExp(`^[${ALPHABET}]{8}$`)

export const parseProductSlug = (input) => {
    if (!input || typeof input !== 'string') {
        return { slug: '', publicId: null }
    }
    const lastDash = input.lastIndexOf('-')
    if (lastDash <= 0) {
        return { slug: input, publicId: null }
    }
    const candidate = input.slice(lastDash + 1)
    if (PUBLIC_ID_PATTERN.test(candidate)) {
        return { slug: input.slice(0, lastDash), publicId: candidate }
    }
    return { slug: input, publicId: null }
}

/**
 * Build the canonical product URL segment.
 *
 *   buildProductSlug('Blue Cotton Shirt', 'A8K3F2H1')
 *     → 'blue-cotton-shirt-A8K3F2H1'
 */
export const buildProductSlug = (slug, publicId) => {
    if (!slug) return publicId || ''
    if (!publicId) return slug
    return `${slug}-${publicId}`
}
