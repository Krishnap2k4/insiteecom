export const ADMIN_DASHBOARD = '/admin/dashboard'

// Media routes 
export const ADMIN_MEDIA_SHOW = '/admin/media'
export const ADMIN_MEDIA_EDIT = (id) => id ? `/admin/media/edit/${id}` : ''

// Category routes 

export const ADMIN_CATEGORY_ADD = '/admin/category/add'
export const ADMIN_CATEGORY_SHOW = '/admin/category'
export const ADMIN_CATEGORY_EDIT = (id) => id ? `/admin/category/edit/${id}` : ''

// Product routes 

export const ADMIN_PRODUCT_ADD = '/admin/product/add'
export const ADMIN_PRODUCT_SHOW = '/admin/product'
export const ADMIN_PRODUCT_EDIT = (id) => id ? `/admin/product/edit/${id}` : ''


// Coupon routes

export const ADMIN_COUPON_ADD = '/admin/coupon/add'
export const ADMIN_COUPON_SHOW = '/admin/coupon'
export const ADMIN_COUPON_EDIT = (id) => id ? `/admin/coupon/edit/${id}` : ''

// Marketing — Module 4

export const ADMIN_CAMPAIGN_SHOW = '/admin/campaign'
export const ADMIN_CAMPAIGN_ADD = '/admin/campaign/add'
export const ADMIN_CAMPAIGN_EDIT = (id) => id ? `/admin/campaign/edit/${id}` : ''

export const ADMIN_NEWSLETTER_SHOW = '/admin/newsletter'

// Messaging / support — Module 6

export const ADMIN_SUPPORT_SHOW = '/admin/support'
export const ADMIN_SUPPORT_DETAILS = (id) => id ? `/admin/support/${id}` : ''
export const ADMIN_CONTACTS_SHOW = '/admin/contacts'
export const ADMIN_CONTACT_DETAILS = (id) => id ? `/admin/contacts/${id}` : ''
export const ADMIN_EMAIL_TEMPLATES_SHOW = '/admin/email-templates'
export const ADMIN_EMAIL_TEMPLATE_EDIT = (id) => id ? `/admin/email-templates/edit/${id}` : ''


// Customer route
export const ADMIN_CUSTOMERS_SHOW = '/admin/customers'


// Reviews — Module 5
export const ADMIN_REVIEW_SHOW = '/admin/review'
export const ADMIN_REVIEW_DETAILS = (id) => id ? `/admin/review/${id}` : ''

// orders routes — Module 3

export const ADMIN_ORDER_SHOW = '/admin/orders'
export const ADMIN_ORDER_DETAILS = (orderRef) => orderRef ? `/admin/orders/details/${orderRef}` : ''
export const ADMIN_REFUND_SHOW = '/admin/refunds'
export const ADMIN_SHIPMENT_SHOW = '/admin/shipments'
export const ADMIN_RETURN_SHOW = '/admin/returns'
export const ADMIN_RETURN_DETAILS = (id) => id ? `/admin/returns/${id}` : ''


// Trash route

export const ADMIN_TRASH = '/admin/trash'


// Module 2 — catalog scalability

export const ADMIN_BRAND_ADD = '/admin/brand/add'
export const ADMIN_BRAND_SHOW = '/admin/brand'
export const ADMIN_BRAND_EDIT = (id) => id ? `/admin/brand/edit/${id}` : ''

export const ADMIN_INVENTORY_SHOW = '/admin/inventory'

export const ADMIN_MAINTENANCE_SHOW = '/admin/maintenance'


// RBAC + customer-group routes (Module 1)

export const ADMIN_ROLES_SHOW = '/admin/roles'
export const ADMIN_ROLES_EDIT = (id) => id ? `/admin/roles/edit/${id}` : ''

export const ADMIN_CUSTOMER_GROUPS_SHOW = '/admin/customer-groups'
export const ADMIN_CUSTOMER_GROUPS_ADD = '/admin/customer-groups/add'
export const ADMIN_CUSTOMER_GROUPS_EDIT = (id) => id ? `/admin/customer-groups/edit/${id}` : ''

// Content — Shop the Look (CMS-ready; will live under the CMS "Content" group)
export const ADMIN_SHOP_THE_LOOK_SHOW = '/admin/shop-the-look'
export const ADMIN_SHOP_THE_LOOK_ADD = '/admin/shop-the-look/add'
export const ADMIN_SHOP_THE_LOOK_EDIT = (id) => id ? `/admin/shop-the-look/edit/${id}` : ''