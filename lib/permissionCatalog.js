/**
 * Canonical list of all permission codes in the app.
 *
 * Single source of truth — referenced by `seed-rbac` to mirror this
 * shape into the Permission collection, by the admin Role editor to
 * render groupings, and by routes via `lib/permissions.js` when they
 * want to gate behaviour on a permission.
 *
 * Add new permission codes here as modules introduce new gated actions.
 * Don't rename codes after they're in production — Role documents
 * reference them by string. To rename, add the new code, migrate Roles
 * to include both, then remove the old.
 */

export const PERMISSION_CATEGORIES = {
    PRODUCTS: 'Products',
    CATEGORIES: 'Categories',
    INVENTORY: 'Inventory',
    ORDERS: 'Orders',
    CUSTOMERS: 'Customers',
    MARKETING: 'Marketing',
    REVIEWS: 'Reviews',
    CMS: 'CMS',
    MEDIA: 'Media',
    SUPPORT: 'Support',
    SETTINGS: 'Settings',
    ANALYTICS: 'Analytics',
}

export const PERMISSIONS = [
    // Products
    { code: 'product.read', name: 'View products', category: PERMISSION_CATEGORIES.PRODUCTS },
    { code: 'product.write', name: 'Create / edit products', category: PERMISSION_CATEGORIES.PRODUCTS },
    { code: 'product.delete', name: 'Delete products', category: PERMISSION_CATEGORIES.PRODUCTS },

    // Categories
    { code: 'category.read', name: 'View categories', category: PERMISSION_CATEGORIES.CATEGORIES },
    { code: 'category.write', name: 'Create / edit categories', category: PERMISSION_CATEGORIES.CATEGORIES },
    { code: 'category.delete', name: 'Delete categories', category: PERMISSION_CATEGORIES.CATEGORIES },

    // Inventory
    { code: 'inventory.read', name: 'View stock levels', category: PERMISSION_CATEGORIES.INVENTORY },
    { code: 'inventory.write', name: 'Adjust stock levels', category: PERMISSION_CATEGORIES.INVENTORY },

    // Orders
    { code: 'order.read', name: 'View orders', category: PERMISSION_CATEGORIES.ORDERS },
    { code: 'order.write', name: 'Update order status', category: PERMISSION_CATEGORIES.ORDERS },
    { code: 'order.refund', name: 'Issue refunds', category: PERMISSION_CATEGORIES.ORDERS },
    { code: 'order.delete', name: 'Delete orders', category: PERMISSION_CATEGORIES.ORDERS },

    // Customers
    { code: 'customers.read', name: 'View customers', category: PERMISSION_CATEGORIES.CUSTOMERS },
    { code: 'customers.write', name: 'Edit customers', category: PERMISSION_CATEGORIES.CUSTOMERS },
    { code: 'customers.delete', name: 'Delete customers', category: PERMISSION_CATEGORIES.CUSTOMERS },
    { code: 'customers.manage_groups', name: 'Manage customer groups', category: PERMISSION_CATEGORIES.CUSTOMERS },

    // Marketing
    { code: 'coupon.read', name: 'View coupons', category: PERMISSION_CATEGORIES.MARKETING },
    { code: 'coupon.write', name: 'Create / edit coupons', category: PERMISSION_CATEGORIES.MARKETING },
    { code: 'coupon.delete', name: 'Delete coupons', category: PERMISSION_CATEGORIES.MARKETING },
    { code: 'campaign.manage', name: 'Manage campaigns', category: PERMISSION_CATEGORIES.MARKETING },

    // Reviews
    { code: 'review.read', name: 'View reviews', category: PERMISSION_CATEGORIES.REVIEWS },
    { code: 'review.moderate', name: 'Approve / reject reviews', category: PERMISSION_CATEGORIES.REVIEWS },
    { code: 'review.reply', name: 'Reply to reviews', category: PERMISSION_CATEGORIES.REVIEWS },

    // CMS
    { code: 'cms.read', name: 'View pages / menus', category: PERMISSION_CATEGORIES.CMS },
    { code: 'cms.write', name: 'Edit pages / menus', category: PERMISSION_CATEGORIES.CMS },
    { code: 'cms.publish', name: 'Publish pages / menus', category: PERMISSION_CATEGORIES.CMS },

    // Media
    { code: 'media.read', name: 'View media library', category: PERMISSION_CATEGORIES.MEDIA },
    { code: 'media.write', name: 'Upload / edit media', category: PERMISSION_CATEGORIES.MEDIA },
    { code: 'media.delete', name: 'Delete media', category: PERMISSION_CATEGORIES.MEDIA },

    // Support
    { code: 'support.read', name: 'View support conversations', category: PERMISSION_CATEGORIES.SUPPORT },
    { code: 'support.reply', name: 'Reply to support tickets', category: PERMISSION_CATEGORIES.SUPPORT },

    // Settings (RBAC, site config)
    { code: 'roles.manage', name: 'Manage roles & permissions', category: PERMISSION_CATEGORIES.SETTINGS },
    { code: 'settings.manage', name: 'Manage site settings', category: PERMISSION_CATEGORIES.SETTINGS },

    // Analytics
    { code: 'analytics.read', name: 'View analytics & reports', category: PERMISSION_CATEGORIES.ANALYTICS },
    { code: 'analytics.export', name: 'Export reports', category: PERMISSION_CATEGORIES.ANALYTICS },
]

/**
 * Default role definitions. Used by the seed-rbac maintenance route
 * to populate the Role collection. Existing roles in the DB are NOT
 * overwritten — only missing ones are created. To intentionally reset
 * a role's permissions, edit it from `/admin/roles`.
 */
export const DEFAULT_ROLES = [
    {
        code: 'customer',
        name: 'Customer',
        description: 'Public-facing storefront user. No admin access.',
        permissions: [],
        isSystem: true,
    },
    {
        code: 'admin',
        name: 'Administrator',
        description: 'Full access to everything.',
        permissions: PERMISSIONS.map((p) => p.code),
        isSystem: true,
    },
    {
        code: 'support',
        name: 'Support',
        description: 'Read orders / customers, reply to support tickets and reviews.',
        permissions: [
            'order.read', 'order.write',
            'customers.read',
            'review.read', 'review.reply',
            'support.read', 'support.reply',
        ],
        isSystem: true,
    },
    {
        code: 'editor',
        name: 'Editor',
        description: 'Edit catalog content and CMS pages. No order or customer access.',
        permissions: [
            'product.read', 'product.write',
            'category.read', 'category.write',
            'review.read', 'review.moderate', 'review.reply',
            'cms.read', 'cms.write', 'cms.publish',
            'media.read', 'media.write',
        ],
        isSystem: true,
    },
    {
        code: 'warehouse_manager',
        name: 'Warehouse Manager',
        description: 'Stock and fulfillment focused — orders and inventory.',
        permissions: [
            'product.read',
            'inventory.read', 'inventory.write',
            'order.read', 'order.write',
        ],
        isSystem: true,
    },
]

export const SYSTEM_ROLE_CODES = DEFAULT_ROLES.map((r) => r.code)
