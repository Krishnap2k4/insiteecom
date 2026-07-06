# Project Documentation

This repository is a full-featured Next.js e-commerce application with three major surfaces:

- a public storefront for customers,
- a backend API layer for commerce, auth, and system operations, and
- a protected admin dashboard for business and content management.

The project is implemented as a single Next.js application using the App Router, with route groups separating website pages, admin pages, and API handlers.

## 1. Project overview

This application supports:

- product discovery, product detail pages, categories, brands, and search-style listing flows,
- cart, checkout, order history, returns, and invoice/download workflows,
- user account features such as addresses, wishlist, and profile data,
- admin catalog and inventory operations,
- marketing, support, CMS, reviews, notifications, and settings workflows,
- MongoDB persistence, authentication, email delivery, payments, and media upload integration.

## 2. Architecture at a glance

The codebase is organized into four major layers:

1. Frontend layer
   - public pages under [app/(root)/(website)](../app/(root)/(website))
   - admin pages under [app/(root)/(admin)](../app/(root)/(admin))
2. Backend/API layer
   - route handlers under [app/api](../app/api)
3. Data layer
   - schemas and models under [models](../models)
4. Shared infrastructure
   - reusable utilities and integrations under [lib](../lib)

## 3. Core technology stack

- Next.js 16 with the App Router
- React 19
- Tailwind CSS and UI primitives from the component system
- Material UI for advanced interactive elements
- Redux and Redux Persist for state management
- React Query for data fetching and mutation flows
- Mongoose for MongoDB access
- Nodemailer for transactional email
- Razorpay for online payments
- Cloudinary for media handling
- Zod for request validation

## 4. Main functional modules

### Storefront / customer experience

- home, shop, products, categories, brands
- cart and checkout
- account dashboard, profile, orders, addresses, wishlist, returns
- contact, policies, and support pages

### Admin experience

- products and categories
- brands and inventory
- orders, shipments, refunds, and returns
- customers, roles, customer groups, and permissions
- campaigns, coupons, newsletter, media, CMS, reviews, support, and settings
- maintenance and migration tools

### Backend services

- authentication and authorization
- payments and webhook processing
- email delivery and notifications
- media uploads and document generation
- audit logging, rate limiting, and soft-delete behavior

## 5. Repository structure

- [app](../app): route groups for website, admin, auth, and API routes
- [components](../components): reusable frontend components and UI primitives
- [hooks](../hooks): shared hooks for auth, fetch logic, layout, and site settings
- [lib](../lib): shared business logic, API clients, auth helpers, integrations, and utilities
- [models](../models): MongoDB models and schemas
- [routes](../routes): centralized route constants for website and admin navigation
- [store](../store): Redux store and reducers
- [public](../public): static assets
- [email](../email): email templates and event-driven email logic

## 6. Development workflow

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## 7. Environment and configuration

The project depends on several environment variables for database access, authentication, email delivery, payments, and media management.

Common variables include:

- MONGODB_URI
- SECRET_KEY
- NEXT_PUBLIC_BASE_URL
- NODEMAILER_HOST
- NODEMAILER_PORT
- NODEMAILER_EMAIL
- NODEMAILER_PASSWORD
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- LOG_LEVEL

## 8. Documentation map

- [Frontend documentation](frontend/README.md)
- [Backend documentation](backend/README.md)
- [Admin panel documentation](admin-panel/README.md)
- [Architecture guide](architecture.md)

## 9. Important implementation notes

- The app uses route protection in [middleware.js](../middleware.js) for admin and account routes.
- API responses are standardized through helpers in [lib/helperFunction.js](../lib/helperFunction.js).
- Database access is routed through [lib/databaseConnection.js](../lib/databaseConnection.js).
- Auth helpers are centralized in [lib/authentication.js](../lib/authentication.js).
- Admin navigation is defined in [lib/adminSidebarMenu.js](../lib/adminSidebarMenu.js).
- Website route helpers live in [routes/WebsiteRoute.js](../routes/WebsiteRoute.js), and admin routes live in [routes/AdminPanelRoute.js](../routes/AdminPanelRoute.js).

## 10. Recommended reading order

1. Start with [frontend/README.md](frontend/README.md)
2. Continue with [backend/README.md](backend/README.md)
3. Review [admin-panel/README.md](admin-panel/README.md)
4. Use [architecture.md](architecture.md) for request flow and design context
