# Architecture Guide

This document explains how the major parts of the application fit together at a system level.

## 1. Request flow

A typical request follows this path:

1. The browser requests a page or API route.
2. Next.js routes the request to the correct App Router page or route handler.
3. Middleware may inspect auth and redirect access where necessary.
4. A page or route handler loads data from the MongoDB layer through Mongoose.
5. The server returns HTML or JSON to the client.
6. The frontend renders the response and updates local or global state as needed.

## 2. Frontend-to-backend boundary

The frontend uses route-based pages for UI and calls backend endpoints under [app/api](../app/api).

This separation keeps UI concerns and data-access logic modular. The frontend does not directly access the database; it talks to the API layer instead.

## 3. Backend services and responsibilities

The backend layer handles:

- authentication and protected access,
- CRUD operations for catalog data,
- cart and checkout state,
- order and payment transitions,
- notifications and email delivery,
- admin-only maintenance and migration tasks.

## 4. Data model strategy

The system uses MongoDB with Mongoose and a soft-delete pattern for many entities. This allows the app to preserve historical records while keeping the current data view clean.

The most important collections include:

- users
- products
- categories
- brands
- product variants
- inventories
- orders
- payments
- addresses
- wishlists
- roles and permissions
- customer groups
- reviews and messages

## 5. Shared infrastructure

A few shared modules are central to the architecture:

- [lib/databaseConnection.js](../lib/databaseConnection.js): connection pooling and reuse
- [lib/helperFunction.js](../lib/helperFunction.js): uniform API responses and error handling
- [lib/authentication.js](../lib/authentication.js): auth checks for route handlers
- [lib/permissions.js](../lib/permissions.js): role/permission evaluation
- [lib/audit.js](../lib/audit.js): audit trail for important operations
- [lib/softDeletePlugin.js](../lib/softDeletePlugin.js): soft-delete behavior for query layers

## 6. Security and access control

Security is split across multiple layers:

- middleware for route-level protection,
- cookies and JWT-based auth,
- role checks for admin or user access,
- rate limiting for sensitive endpoints,
- signature verification for payment webhooks.

## 7. Operational concerns

The application is designed with practical operational concerns in mind:

- it supports maintenance scripts for migration and seeding,
- it handles email and payment notifications,
- it captures audit trails for admin actions,
- it allows the system to run in a typical Next.js deployment environment with MongoDB backing.

## 8. Recommended mental model

When working in this codebase, think in terms of three layers:

- UI layer: pages and components,
- API layer: route handlers and business logic,
- data layer: Mongoose models and MongoDB collections.

That mental model makes it easier to locate features, understand data flow, and extend the product safely.
