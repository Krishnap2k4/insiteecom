# Admin Panel Documentation

The admin panel is the internal management surface of the application. It is designed for operators, managers, and administrators who need to maintain the storefront, handle orders, manage users and permissions, and operate the system safely.

## 1. Admin panel purpose

The admin experience supports:

- catalog management for categories, products, brands, inventory, and variants,
- order and fulfillment operations,
- customer and account oversight,
- marketing and content operations,
- media and settings configuration,
- maintenance and migration tools.

## 2. Admin route structure

Admin pages are grouped under [app/(root)/(admin)](../../app/(root)/(admin)).

The navigation structure is defined in [lib/adminSidebarMenu.js](../../lib/adminSidebarMenu.js), and route constants are centralized in [routes/AdminPanelRoute.js](../../routes/AdminPanelRoute.js).

## 3. Access and protection

Admin routes are protected by [middleware.js](../../middleware.js).

The middleware checks the user session and redirects unauthenticated or unauthorized users away from protected admin pages. In practice, this means the admin area is reserved for authenticated administrator-level users.

## 4. Main admin modules

### Catalog management

Admin catalog features include:

- category creation and editing,
- product creation, editing, and publishing,
- brand management,
- inventory view and adjustments,
- product variant management.

These modules are important because the storefront depends on the catalog data being complete and consistent.

### Commerce and fulfillment

The admin order experience includes:

- order viewing and management,
- shipment tracking and updates,
- refund and return review,
- coupon management,
- order-related analytics and status handling.

### Customer management

The customer area includes:

- customer listings,
- customer groups,
- role and permission management,
- oversight of user-related data such as addresses and wishlist content where relevant.

### Marketing and content

The admin panel also supports:

- coupons and campaigns,
- newsletter management,
- support inbox and contact submissions,
- review moderation,
- CMS and shop-the-look content,
- media library workflows.

### System operations

The admin system also includes:

- settings and configuration,
- maintenance endpoints and migration runners,
- email template management,
- general operational tooling.

## 5. Sidebar navigation overview

The sidebar menu in [lib/adminSidebarMenu.js](../../lib/adminSidebarMenu.js) organizes the admin area into the following groups:

- Dashboard
- Category
- Products
- Brands
- Inventory
- Marketing
- Support
- Orders
- Customers
- Roles & Permissions
- Reviews
- Media
- Content
- Maintenance
- Settings

## 6. Admin data and workflow patterns

The admin interface typically follows consistent patterns:

- list views for browsing entities,
- add/edit forms for creating and updating records,
- table-based or card-based layouts depending on the module,
- media selection and rich-editor components where needed,
- confirmation dialogs for destructive changes,
- audit-friendly actions for administrative changes.

## 7. Backend support for the admin panel

The admin UI relies on backend endpoints under [app/api](../../app/api), especially:

- [app/api/admin](../../app/api/admin) for admin-only management routes,
- [app/api/maintenance](../../app/api/maintenance) for migration and setup tasks,
- [app/api/brand](../../app/api/brand), [app/api/category](../../app/api/category), and [app/api/product](../../app/api/product) for catalog operations,
- [app/api/orders](../../app/api/orders) and [app/api/payment](../../app/api/payment) for commerce workflows,
- [app/api/settings](../../app/api/settings), [app/api/media](../../app/api/media), and [app/api/cms](../../app/api/cms) for system and content management.

## 8. Maintenance and operational tools

The admin maintenance area is an important part of the system. It provides one-click operations for tasks such as:

- seeding permissions and customer groups,
- generating default product variants,
- running catalog migration tasks,
- preparing the database for the current application version.

These operations are designed to be idempotent and safe to rerun.

## 9. Adding a new admin feature

When introducing a new admin capability:

1. create or update the page under [app/(root)/(admin)](../../app/(root)/(admin)),
2. add the route constants to [routes/AdminPanelRoute.js](../../routes/AdminPanelRoute.js) if needed,
3. add the navigation entry in [lib/adminSidebarMenu.js](../../lib/adminSidebarMenu.js),
4. implement the supporting backend API in [app/api](../../app/api),
5. enforce auth and permission checks,
6. ensure the workflow fits the existing admin UI patterns.

## 10. Admin developer checklist

Before shipping a new admin feature, confirm that:

- the route is protected and only available to the intended role,
- the page uses the shared route constants and sidebar structure,
- backend endpoints are implemented with proper validation and error handling,
- the UI provides clear empty, loading, and error states,
- destructive changes are guarded or confirmed,
- the feature integrates cleanly with the existing catalog, order, or customer flow.

## 11. Important admin files

- [routes/AdminPanelRoute.js](../../routes/AdminPanelRoute.js)
- [lib/adminSidebarMenu.js](../../lib/adminSidebarMenu.js)
- [middleware.js](../../middleware.js)
- [app/(root)/(admin)](../../app/(root)/(admin))
- [app/api/maintenance](../../app/api/maintenance)
