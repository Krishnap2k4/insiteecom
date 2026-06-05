export const WEBSITE_HOME = "/"
export const WEBSITE_LOGIN = "/auth/login"
export const WEBSITE_REGISTER = "/auth/register"
export const WEBSITE_RESETPASSWORD = "/auth/reset-password"

export const WEBSITE_SHOP = "/shop"

/**
 * Build a product detail URL.
 *
 *   WEBSITE_PRODUCT_DETAILS('blue-shirt', 'A8K3F2H1') → /product/blue-shirt-A8K3F2H1
 *   WEBSITE_PRODUCT_DETAILS('blue-shirt')              → /product/blue-shirt  (legacy fallback)
 *   WEBSITE_PRODUCT_DETAILS()                          → /product
 *
 * Both shapes still resolve at `/api/product/details/[slug]` — the
 * route parses the trailing publicId when present and 301s when the
 * slug part has drifted.
 */
export const WEBSITE_PRODUCT_DETAILS = (slug, publicId) => {
    if (!slug) return '/product'
    if (publicId) return `/product/${slug}-${publicId}`
    return `/product/${slug}`
}

/**
 * Hierarchical category browse path.
 *
 *   WEBSITE_CATEGORY('men/shirts/casual') → /c/men/shirts/casual
 *   WEBSITE_CATEGORY(['men', 'shirts'])   → /c/men/shirts
 */
export const WEBSITE_CATEGORY = (path) => {
    if (!path) return '/c'
    const segments = Array.isArray(path) ? path : String(path).split('/').filter(Boolean)
    return `/c/${segments.join('/')}`
}

export const WEBSITE_BRAND = (slug) => slug ? `/b/${slug}` : '/b'

export const WEBSITE_CART = "/cart"
export const WEBSITE_CHECKOUT = "/checkout"

export const WEBSITE_ORDER_DETAILS = (order_id) => `/order-details/${order_id}`
export const WEBSITE_RETURNS = '/returns'
export const WEBSITE_RETURN_DETAILS = (ref) => ref ? `/returns/${ref}` : '/returns'
export const WEBSITE_RETURN_REQUEST = (orderRef) => orderRef ? `/returns/request/${orderRef}` : '/returns/request'
export const WEBSITE_INVOICE_DOWNLOAD = (orderRef) => orderRef ? `/api/invoice/${orderRef}/download` : ''


// User routes
export const USER_DASHBOARD = "/my-account"
export const USER_PROFILE = "/profile"
export const USER_ORDERS = "/orders"
export const USER_RETURNS = "/returns"
export const USER_ADDRESSES = "/addresses"
export const USER_WISHLIST = "/wishlist"
export const USER_MESSAGES = "/account/messages"

export const WEBSITE_MESSAGES = '/account/messages'
export const WEBSITE_MESSAGE_DETAILS = (id) => id ? `/account/messages/${id}` : '/account/messages'
export const WEBSITE_MESSAGES_NEW = (orderRef) => orderRef ? `/account/messages/new?order=${orderRef}` : '/account/messages/new'
export const WEBSITE_CONTACT = '/contact-us'
