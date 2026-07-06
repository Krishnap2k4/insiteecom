# Backend Documentation

The backend is implemented as a collection of Next.js route handlers under [app/api](../../app/api), backed by MongoDB models in [models](../../models) and shared infrastructure in [lib](../../lib).

## 1. Backend purpose

The backend layer is responsible for:

- authenticating users and protecting account/admin routes,
- serving product, category, brand, inventory, and order data,
- handling payments, refunds, invoices, and webhook events,
- creating and updating user account data such as addresses and wishlist items,
- powering admin management, maintenance operations, CMS, and settings endpoints.

## 2. Backend folder structure

- [app/api](../../app/api): route handlers grouped by feature area
- [models](../../models): Mongoose schemas and data models
- [lib](../../lib): shared backend helpers and integrations
- [email](../../email): email templates and email event logic
- [routes](../../routes): route constants used by both frontend and backend code

## 3. Request and response conventions

Most API routes follow a consistent approach:

- validate incoming request data with Zod where appropriate,
- perform CRUD or business actions against MongoDB,
- return a standard JSON payload using the helpers in [lib/helperFunction.js](../../lib/helperFunction.js),
- surface failures using centralized error handling,
- enforce auth/role checks when the route is protected.

The standard response shape is:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

## 4. Authentication and authorization

Authentication is handled through JWTs stored in cookies and verified with the helper in [lib/authentication.js](../../lib/authentication.js).

### Current approach

- access tokens are read from the access_token cookie,
- route handlers can check whether the caller is authenticated,
- some routes require a specific role, such as admin or user,
- middleware in [middleware.js](../../middleware.js) also guards high-level route access.

## 5. Core backend modules

### Database access

- [lib/databaseConnection.js](../../lib/databaseConnection.js): establishes and caches the MongoDB connection

### API response helpers

- [lib/helperFunction.js](../../lib/helperFunction.js): standard response, error mapping, and common UI helper functions

### Auth helpers

- [lib/authentication.js](../../lib/authentication.js): authentication checks for route handlers
- [lib/permissions.js](../../lib/permissions.js): permission-based authorization logic

### Security and resilience

- [lib/rateLimit.js](../../lib/rateLimit.js): request throttling for auth and payment operations
- [lib/softDeletePlugin.js](../../lib/softDeletePlugin.js): soft-delete behavior for MongoDB documents
- [lib/audit.js](../../lib/audit.js): audit logging for significant admin actions

### Integrations

- [lib/sendMail.js](../../lib/sendMail.js): transactional email sending
- [lib/cloudinary.js](../../lib/cloudinary.js): media upload support
- [lib/invoicePdf.js](../../lib/invoicePdf.js): invoice PDF generation
- [lib/notifications.js](../../lib/notifications.js): in-app/system notifications
- [lib/orderEmails.js](../../lib/orderEmails.js): order-related email templates

## 6. Major backend feature areas

### Authentication and account APIs

Routes under [app/api/auth](../../app/api/auth) and [app/api/account](../../app/api/account) cover:

- registration and login,
- password reset,
- OTP verification and resend,
- logout,
- account profile updates,
- addresses and wishlist management.

### Catalog APIs

Routes under [app/api/category](../../app/api/category), [app/api/brand](../../app/api/brand), [app/api/product](../../app/api/product), and [app/api/product-variant](../../app/api/product-variant) cover:

- product listing and detail retrieval,
- category tree and category lookup,
- brand CRUD and storefront lookup,
- variant lookup and inventory-related access.

### Cart and checkout APIs

Routes under [app/api/cart](../../app/api/cart), [app/api/checkout](../../app/api/checkout), and [app/api/payment](../../app/api/payment) cover:

- cart creation and updates,
- cart merge for authenticated users,
- payment order ID creation,
- webhook verification and payment state updates,
- invoice generation and order placement logic.

### Orders and fulfillment APIs

Routes under [app/api/orders](../../app/api/orders) and related modules cover:

- order creation and retrieval,
- refund and return data,
- shipment and fulfillment-related operations,
- order history and status updates.

### Admin and maintenance APIs

Routes under [app/api/admin](../../app/api/admin), [app/api/maintenance](../../app/api/maintenance), [app/api/media](../../app/api/media), [app/api/settings](../../app/api/settings), [app/api/cms](../../app/api/cms), and [app/api/newsletter](../../app/api/newsletter) cover:

- role and permission management,
- customer group management,
- maintenance runners and migrations,
- media management,
- CMS content updates,
- newsletter subscription and confirmation flows.

## 7. Key data models

The backend relies on MongoDB models such as:

- [models/User.model.js](../../models/User.model.js): users, profile fields, login info, and role references
- [models/Product.model.js](../../models/Product.model.js): product metadata, pricing, variants, SEO, options, and specifications
- [models/Category.model.js](../../models/Category.model.js): hierarchical category data
- [models/Brand.model.js](../../models/Brand.model.js): brand information and active/system flags
- [models/ProductVariant.model.js](../../models/ProductVariant.model.js): per-variant selling data, SKU, stock, and option values
- [models/Inventory.model.js](../../models/Inventory.model.js): inventory quantities and reorder settings
- [models/Order.model.js](../../models/Order.model.js): order snapshots, pricing, address snapshots, and statuses
- [models/Payment.model.js](../../models/Payment.model.js): payment records and gateway references
- [models/Address.model.js](../../models/Address.model.js): user address book data
- [models/WishlistItem.model.js](../../models/WishlistItem.model.js): wishlist state
- [models/Role.model.js](../../models/Role.model.js) and [models/Permission.model.js](../../models/Permission.model.js): RBAC structure
- [models/CustomerGroup.model.js](../../models/CustomerGroup.model.js): customer tiers and pricing rules
- [models/Review.model.js](../../models/Review.model.js), [models/Message.model.js](../../models/Message.model.js), and [models/Notification.model.js](../../models/Notification.model.js): customer engagement modules

## 8. Data integrity and platform conventions

The backend includes a number of cross-cutting behaviors:

- soft-delete support via [lib/softDeletePlugin.js](../../lib/softDeletePlugin.js),
- audit logging for admin changes via [lib/audit.js](../../lib/audit.js),
- rate limiting for sensitive endpoints such as auth and payment routes,
- centralized response formatting via [lib/helperFunction.js](../../lib/helperFunction.js),
- consistent use of cookies and JWT-based session handling.

## 9. Payment and email integrations

### Payments

The payment system uses Razorpay with webhook processing in [app/api/payment/webhook/razorpay/route.js](../../app/api/payment/webhook/razorpay/route.js). This route verifies signatures and updates order/payment status based on gateway events.

### Email

Transactional email uses [lib/sendMail.js](../../lib/sendMail.js) and related email helpers in [email](../../email). This covers verification emails, OTP handling, order notifications, and subscription-related communication.

## 10. Backend development guidelines

When adding a new backend feature:

1. place the route handler under the appropriate folder inside [app/api](../../app/api),
2. add or update the supporting model in [models](../../models) if needed,
3. keep business logic in [lib](../../lib) where it can be reused,
4. follow the shared response conventions,
5. enforce auth/permission checks for protected routes,
6. add audit or logging behavior where the action is significant.

## 11. Important backend files

- [lib/databaseConnection.js](../../lib/databaseConnection.js)
- [lib/helperFunction.js](../../lib/helperFunction.js)
- [lib/authentication.js](../../lib/authentication.js)
- [lib/permissions.js](../../lib/permissions.js)
- [lib/rateLimit.js](../../lib/rateLimit.js)
- [lib/sendMail.js](../../lib/sendMail.js)
- [app/api/payment/webhook/razorpay/route.js](../../app/api/payment/webhook/razorpay/route.js)
- [middleware.js](../../middleware.js)
