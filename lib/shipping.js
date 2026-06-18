/**
 * Shipping rule defaults — used as fallbacks when the DB has no settings yet,
 * and imported by client components (keep this file free of server-only imports).
 *
 * Live values are stored in the Settings collection and managed via
 * /admin/settings. Use lib/settings.js → getShippingSettings() on the server.
 */

export const FREE_DELIVERY_THRESHOLD  = 999  // default fallback
export const STANDARD_DELIVERY_CHARGE = 99   // default fallback

/**
 * Returns the shipping charge for a given subtotal.
 *
 * @param {number} subtotal       Cart subtotal (after item discounts, before coupon)
 * @param {object} settings       Optional live settings from getShippingSettings()
 */
export const computeShipping = (subtotal, settings = {}) => {
    const threshold = settings.freeDeliveryThreshold  ?? FREE_DELIVERY_THRESHOLD
    const charge    = settings.standardDeliveryCharge ?? STANDARD_DELIVERY_CHARGE
    return Number(subtotal) >= threshold ? 0 : charge
}
