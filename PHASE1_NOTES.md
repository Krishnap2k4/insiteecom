# Module 0 — Platform Foundation Notes

This document covers the platform-layer infrastructure (logger, errors,
rate limit, soft delete, audit, redirects, webhooks, etc.) and the env
variables needed for the new features. It is the foundation that every
feature module (Users, Products, Orders, ...) builds on.

## New / required env vars

Add these to `.env.local`:

```
# Email — SMTP host must be a real server. Gmail App Password requires 2FA.
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_EMAIL=your-address@gmail.com
NODEMAILER_PASSWORD=your-app-password

# Razorpay webhook secret — copy from Razorpay Dashboard → Webhooks.
# Without this, the webhook route returns 500 ("Webhook not configured").
RAZORPAY_WEBHOOK_SECRET=replace-me

# Optional log level: debug | info | warn | error  (default: info)
LOG_LEVEL=info

# Optional — override the MongoDB database name. Defaults to
# 'YT-NEXTJS-ECOMMERCE' (the existing DB). Set this only if you
# intentionally want a different database.
# MONGODB_DB_NAME=YT-NEXTJS-ECOMMERCE
```

Restart `next dev` after editing env (Next reads env once at startup).

## Razorpay webhook

Configure on Razorpay Dashboard → Webhooks:

- URL: `<NEXT_PUBLIC_BASE_URL>/api/payment/webhook/razorpay`
- Events: `payment.captured`, `payment.failed`, `order.paid`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET`

The webhook is the source of truth for payment status. The client-side
`save-order` flow still exists, but should be treated as a hint — the
webhook overwrites order status authoritatively.

## What was added

| Area | File | Purpose |
|---|---|---|
| Logging | `lib/logger.js` | Structured JSON logger (info/warn/error/debug) |
| Errors | `lib/AppError.js`, `lib/withApiHandler.js` | Typed errors + central handler (opt-in per route) |
| Redirects | `models/Redirect.model.js`, `lib/redirects.js`, `app/not-found.jsx` | URL redirect table; lookup wired into the global 404 handler with a 60 s in-process cache |
| Audit | `models/AuditLog.model.js`, `lib/audit.js` | Append-only admin action log |
| Webhooks | `app/api/payment/webhook/razorpay/route.js` | HMAC-verified Razorpay webhook |
| Rate limit | `lib/rateLimit.js` | In-memory limiter on auth + payment routes |
| Soft delete | `lib/softDeletePlugin.js` | Auto-filters `deletedAt: null` on find/count |
| HTTP client | `lib/apiClient.js` | Shared axios instance — `validateStatus: () => true` so 4xx/5xx don't throw and the existing read-then-branch pattern keeps working |
| Default variants | `models/ProductVariant.model.js`, `app/api/product/create/route.js`, `app/api/product/update/route.js`, `app/api/product/details/[slug]/route.js`, `app/api/maintenance/seed-default-variants/route.js` | Every product owns an auto-managed `isDefault: true` variant so it is purchasable the instant it is created. Custom variants (color/size) are layered on top and take precedence; the default is the silent fallback. |

## What was fixed

- `app/api/auth/register/route.js` — `catchError` now returns its response; `sendMail` failures surface instead of silently succeeding.
- `app/api/auth/logout/route.js`, `app/api/auth/resend-otp/route.js`, `app/api/auth/reset-password/send-otp/route.js`, `app/api/auth/reset-password/update-password/route.js` — same `catchError` return bug.
- `app/api/product/details/[slug]/route.js` — products without a variant now render gracefully instead of 404-ing as "Data not found". Variant queries also filter `deletedAt: null`.
- `app/(root)/(website)/product/[slug]/ProductDetails.jsx` — shows product info, falls back to product-level price/media, disables Add to Cart with "Currently Unavailable" when no variant exists.
- `lib/helperFunction.js` — `response()` and `catchError()` now set the actual HTTP status on the Response. Body shape `{ success, statusCode, message, data }` unchanged.
- `lib/databaseConnection.js` — `dbName` is now env-overridable via `MONGODB_DB_NAME`; defaults to the current value so existing data stays reachable.
- `middleware.js` — broader matcher (every page request except API/static); stamps `x-pathname` on the forwarded request headers; existing auth gating only fires for `/auth`, `/admin`, `/my-account` so public pages aren't forced through login.
- All 31 files importing `axios` directly → now import from `@/lib/apiClient` so non-2xx responses no longer throw.

## Default-variant scheme (Shopify pattern)

Every product carries exactly one auto-managed variant flagged
`isDefault: true`, plus zero or more "custom" variants (color/size)
the admin adds explicitly.

**What this means in practice:**
- Admin creates a product → the create API also writes a default variant
  whose SKU is `<PRODUCT_SLUG>-DEFAULT`. The product is purchasable
  immediately, no extra clicks.
- Admin updates a product's price/media → the default variant is kept
  in sync. Custom variants are never touched by product updates.
- Customer visits the product page → the API prefers a custom variant
  if one exists, falls back to the default. Color/size selectors are
  populated only from custom variants, so the default never pollutes
  the dropdowns.
- Admin tables show transparency markers:
  - Product list — Variants column shows either `X custom` or a
    `Default only` chip.
  - Variant list — Type column shows a `Default` or `Custom` chip
    against each row; the variant table itself doesn't lie about what
    exists.
  - Product edit page — Variants card explains the state and links to
    add or browse variants.

**One-time backfill for existing products:**
After deploying this change, run the seeder once to create defaults
for products created before the change:

```
# logged in as admin in the browser, copy the access_token cookie value
curl -X POST http://localhost:3000/api/maintenance/seed-default-variants \
     -b 'access_token=<your-cookie-value>'
```

The endpoint is idempotent — re-running it reports 0 created.

## Module 1 — Users (shipped)

New data:
- **Address** (`models/Address.model.js`) — per-user address book with `isDefault`, `type` (billing/shipping/both), soft-delete. Order will snapshot these at checkout time in Module 3.
- **WishlistItem** (`models/WishlistItem.model.js`) — one row per saved (user, product, variant). Unique compound index prevents duplicate adds.
- **CustomerGroup** (`models/CustomerGroup.model.js`) — retail / wholesale / vip tiers with `discountPercent`, `taxExempt`. Foundation for Marketing module rules.
- **Role** + **Permission** (`models/Role.model.js`, `models/Permission.model.js`) — RBAC scaffolding. Catalog of permission codes lives in `lib/permissionCatalog.js`; the `seed-rbac` route mirrors it into the Permission collection.
- **User** (`models/User.model.js`) — extended with `phoneVerified`, `lastLoginAt`, `loginProviders[]`, `customerGroup`, `defaultAddress`, `roles[]`. Legacy `role` string preserved for backward compatibility — current auth still gates by it. Routes opt in to permission checks via `hasPermission()` in `lib/permissions.js` as each module migrates.

New customer endpoints:
- `GET /api/account/addresses`, `POST /api/account/addresses`
- `PUT/DELETE /api/account/addresses/[id]`
- `POST /api/account/addresses/[id]/default` — promote one address to default; clears flag on others atomically.
- `GET /api/account/wishlist` (populated product + variant)
- `POST /api/account/wishlist` (idempotent — already-saved returns success message)
- `DELETE /api/account/wishlist/[id]`
- `GET /api/account/wishlist/count` — lightweight, returns 0 for guests (no error).

New admin endpoints:
- `GET /api/admin/roles`, `POST /api/admin/roles`
- `GET/PUT/DELETE /api/admin/roles/[id]` — system roles can't be deleted, only their permissions edited.
- `GET /api/admin/customer-groups`, `POST /api/admin/customer-groups`
- `GET/PUT/DELETE /api/admin/customer-groups/[id]` — same protection for system groups.
- `GET /api/admin/permissions` — returns the catalog grouped by category for the role editor UI.

New customer UI:
- `/addresses` — card-grid address book with add/edit dialog, delete confirm, set-as-default. Empty/loading/logged-out states all styled. Uses existing shadcn Form, Input, Dialog, Button + reusable `AddressForm` and `AddressCard` components.
- `/wishlist` — product card grid with **Add to cart** and Remove on every card. Falls back gracefully when not logged in.
- Header — heart icon opens a **slide-out wishlist sheet** (right-side, mirroring the Cart UX). Items load lazily when the drawer opens. Each item has Add-to-cart + Remove; "View full wishlist" link in the footer goes to `/wishlist`. Live count badge stays in sync with mutations.
- Product page — new `WishlistButton` next to Add to Cart. Heart fills when the product is already saved.

New admin UI:
- `/admin/roles` — list of roles with system / custom badges and permission counts.
- `/admin/roles/edit/[id]` — edit role permissions via grouped multi-select (categories collapsible, per-category "all / some / none" master checkbox).
- `/admin/customer-groups` — card-grid list with default / system / tax-exempt chips.
- `/admin/customer-groups/add` and `/admin/customer-groups/edit/[id]` — shared `CustomerGroupForm`. Code field locked on edit.
- Sidebar — Customers now has a submenu (All customers / Customer groups / Add group). New "Roles & Permissions" entry at the top level.

User-panel navigation — Addresses and Wishlist links added next to Profile / Orders.

Redux — new `wishlistStore` slice (count + lastChange timestamp) so the header badge stays in sync with adds/removes without a page reload.

**One-time setup after deploying Module 1:**

```
# Logged in as admin in the browser, copy the access_token cookie value.
curl -X POST http://localhost:3000/api/maintenance/seed-rbac \
     -b 'access_token=<your-cookie-value>'
```

Seeds the Permission catalog, default Roles (customer, admin, support, editor, warehouse_manager), the `retail` CustomerGroup, and back-fills the `admin` role assignment on every existing legacy admin user. Idempotent — safe to re-run.

## Module 2 — Products / catalog scalability (shipped)

New data:
- **Product** (`models/Product.model.js`) — extended with `publicId` (unique 8-char NanoID via `lib/publicId.js`), `brand` (ref), `categories[]` (multi-ref alongside legacy `category`), `sku`, `status` (`draft`/`published`/`archived`), `shortDescription`, `tags[]`, `weight`, `dimensions`, `seo {title, description, canonical, ogImage}`, `taxClass`, `shippingClass`, `hsnCode`, `ratingAvg`, `ratingCount`, `salesCount`, `relatedProducts`, `crossSell`, `upSell`. All new fields optional — pre-migration documents continue to work.
- **Category** (`models/Category.model.js`) — extended with `parent`, `ancestors[]`, `path`, `depth`, `image` (ref Media), `description`, `sortOrder`, `isActive`, `seo`. Unique indexes on (parent, slug) and (path) prevent duplicate URLs. `lib/catalog.js` keeps the hierarchy fields consistent on save and propagates parent renames to descendants.
- **Brand** (`models/Brand.model.js`) — name / slug / logo / description / isActive / isSystem / seo. System brands ('generic') can't be deleted.
- **Inventory** (`models/Inventory.model.js`) — split from variant: `variant`, `product`, `warehouse`, `quantity`, `reserved`, virtual `available`, `reorderLevel`, `backorderable`. Unique on (variant, warehouse).
- **AttributeDefinition** + **AttributeSet** (`models/AttributeDefinition.model.js`, `models/AttributeSet.model.js`) — foundation for flexible variant axes. Admin UI deferred to Module 2.5.

New library helpers:
- `lib/publicId.js` — `generatePublicId()`, `generateUniquePublicId(exists)`, `parseProductSlug(input)`, `buildProductSlug(slug, publicId)`. Crockford-style alphabet (no 0/O/1/I/l). Uses Node's `crypto.randomBytes` — no new dependencies.
- `lib/catalog.js` — `resolveHierarchy()`, `propagateHierarchy()`, `findCategoryByPath()`.

URL scheme:
- Product URL: `/product/<slug>-<publicId>` (canonical). Lookup matches the publicId, and the SSR page (`app/(root)/(website)/product/[slug]/page.jsx`) issues a 301 to the canonical URL when the slug part is stale. Legacy `/product/<slug>` URLs continue to resolve via slug fallback.
- Categories: `/c/[...slug]` — hierarchical path of any depth.
- Brands: `/b/<slug>`.
- `routes/WebsiteRoute.js` — `WEBSITE_PRODUCT_DETAILS(slug, publicId?)` returns the new URL when publicId is provided, falls back to slug-only otherwise. New helpers `WEBSITE_CATEGORY(path)` and `WEBSITE_BRAND(slug)`.

New endpoints:
- Brand admin CRUD: `GET /api/brand`, `POST /api/brand/create`, `PUT /api/brand/update`, `PUT/DELETE /api/brand/delete`, `GET /api/brand/get/[id]`.
- Brand public: `GET /api/brand/get-brands` (active list for selects), `GET /api/brand/by-slug/[slug]` (landing page data).
- Category tree: `GET /api/category/tree` (nested), `GET /api/category/by-path?path=...` (resolves storefront URL).
- Category CRUD updated to compute path/ancestors/depth on save and propagate to descendants on rename / move.
- Product `create` / `update` accept `brand`, `status`, `shortDescription`, `tags`, `categories[]`, `seo` (optional). `create` generates `publicId`; `update` never overwrites it.
- Product `details/[slug]` parses `<slug>-<publicId>`, prefers publicId lookup, returns `canonicalUrl` and `slugMismatch` so the page can 301.

New storefront pages:
- `/c/[...slug]` — hierarchical category browse with breadcrumb, sub-category chips, product grid. Modern hero, soft gradient header, responsive grid using `ProductBox`.
- `/b/[slug]` — brand landing with logo hero, description, product grid.

New admin pages:
- `/admin/brand`, `/admin/brand/add`, `/admin/brand/edit/[id]` — full CRUD using a shared `BrandForm` (name, slug auto-derive, logo via MediaModal, description, isActive, SEO meta). Datatable shows productCount + active/system badges.
- `/admin/category/add` and `/admin/category/edit/[id]` — rewritten to use a shared `CategoryForm` with parent picker (tree flattened with indent markers; excludes self + descendants on edit), sortOrder, isActive, image, SEO.
- `/admin/product/add` and `/admin/product/edit/[id]` — extended with brand picker, status picker (Published / Draft / Archived), short description input. Existing fields untouched.
- Sidebar — new **Brands** entry with Add / All submenu.

**One-time setup after deploying Module 2:**

```
curl -X POST http://localhost:3000/api/maintenance/migrate-catalog \
     -b 'access_token=<your-admin-cookie>'
```

Backfills `publicId` on every existing product, computes `path` / `ancestors` / `depth` on every category (treating existing as root), creates a default `generic` Brand if none exists, and seeds one Inventory row per ProductVariant. Idempotent — safe to re-run.

**Smoke (all green)**
- Public: `/`, `/shop`, `/addresses`, `/wishlist`, `/auth/login` → 200.
- New APIs: `/api/brand/get-brands` (200, empty array), `/api/category/tree` (200, with existing test-cat), `/api/category/by-path?path=nonexistent` → 404 (proper status), `/api/brand/by-slug/nonexistent` → 404.
- New admin endpoints: `/api/brand`, `/api/brand/create`, `/api/maintenance/migrate-catalog` → 403 without auth.
- Admin pages: `/admin/brand`, `/admin/brand/add`, `/admin/category/add` → 307 redirect to login.
- No app errors in dev log.

### Module 2 follow-up (also shipped — no deferrals)

The originally-deferred items are now part of Module 2 proper:

- **Attribute system UI** — full CRUD at `/admin/attribute` and `/admin/attribute-set`. Attributes carry `code`, `label`, `type` (select/multiselect/number/text/bool/color), `unit`, flags (`isVariantAxis`/`isFilterable`/`isSearchable`), and a per-attribute `values[]` editor for select-style types. AttributeSets bundle attribute references with a multi-select picker.
- **Variant `attributes[]`** — additive field on ProductVariant. Variant create/update now accept an `attributes[]` payload and auto-mirror `color`/`size` into it so legacy admin flows still produce consistent data. New custom (non-color/size) axes can be added per-variant via the `VariantAttributesEditor` component on the variant add page.
- **Storefront dynamic axes** — `ProductDetails.jsx` now reads the API's `axes[]` and renders generic selectors (color axis → swatch grid, others → button grid). Legacy `colors`/`sizes` props still work as a fallback. Selection URLs are built dynamically per axis code.
- **Inventory admin** — `/admin/inventory` table with per-row Adjust dialog (`set absolute` or `add/subtract delta`), reorder-level editing, optional reason. Low-stock rows are highlighted amber, out-of-stock red. `POST /api/admin/inventory/[id]/adjust` is audit-logged.
- **SEO + tags on products** — Tags chip input, meta title / canonical / description, and Open Graph image (via MediaModal) on both product add and edit. `seo.ogImage` is populated in the get endpoint so editing shows the current image.
- **Sitemap + robots** — `app/sitemap.xml/route.js` produces a dynamic sitemap of home/shop/static pages + every active category path + every active brand + every published product (canonical `<slug>-<publicId>` URL). `app/robots.txt/route.js` disallows admin/API/auth/account paths and points crawlers at the sitemap.
- **Migration extended** — `migrate-catalog` now also seeds the default Color + Size AttributeDefinitions, mirrors legacy `color`/`size` into `variant.attributes[]`, and seeds Inventory rows. Idempotent.
- **Sidebar** — new top-level entries: Attributes (Add / All / Sets), Inventory.

### Module 2 redesign round (Shopify-style data model)

A clean redesign — the previous setup had four overlapping ways to express the same idea (global AttributeDefinition catalog, AttributeSet, hardcoded variant.color/size, variant.attributes[]). Consolidated to **two clear concepts**, the way Shopify does it:

- **Options** (per-product, on `Product.options[]`) — drive variants. Each option = `{ name, values[] }` where `name` is free text ("Color", "Size", "Storage") and `values` is the allowed list for variants of THIS product. Max 3 options. Defined inline on the product form — no global catalog to maintain.
- **Specifications** (per-product, on `Product.specifications[]`) — static info shown as a table on the storefront. Each row = `{ name, value }` (Material, Country of origin, Care instructions). Distinct from options — these are NOT axes for variants.

Variants now reference `optionValues[]` — each entry `{ name, value }` matches one of the product's options. The variant API still writes the Color/Size value back into legacy `variant.color`/`variant.size` so cart/order code that reads those keeps working untouched.

**UI shape**
- `OptionsEditor` on product Add/Edit (chip-style values, up to 3 options).
- `SpecificationsEditor` (key/value rows).
- The old `AttributesEditor` is gone from product/variant forms.
- `VariantsManager` now has two clear modes: **Single-SKU panel** (when product has no options — inline SKU + stock; default variant is invisible plumbing) and **Variants table** (when options exist — list of customer-visible variants; default variant filtered out).
- `VariantFormDialog` renders one dropdown per product option, sourced from that option's values. No more free-text color/size, no parallel attributes editor.
- Storefront `ProductDetails` reads `product.options` and `product.specifications` directly.

**Admin cleanup (now fully done)**
- Removed `/admin/attribute` and `/admin/attribute-set` pages plus the underlying API routes (`/api/admin/attribute/*`, `/api/admin/attribute-set/*`, `/api/attribute/*`), models (`AttributeDefinition`, `AttributeSet`), form components (`AttributeForm`, `AttributeSetForm`), and reusable editors (`AttributesEditor`, `VariantAttributesEditor`). Sidebar + route constants cleaned up.
- The `migrate-catalog` route no longer references AttributeDefinition seeding — the new model is per-product so a global catalog isn't needed.
- The deprecated `Product.attributes[]` and `ProductVariant.attributes[]` schema fields are kept for one more round so unmigrated data isn't lost; the runtime code falls back to legacy `color`/`size` reads.

**Admin Maintenance page (NEW)**
- `/admin/maintenance` — one-click runners for every idempotent migration: Seed RBAC & customer groups, Seed default variants, Migrate catalog. Each card shows the task description, a Run button (loading state + Run again after success), and a green Success panel with the JSON summary in a collapsible `<details>` block. Errors show in a red panel with the message.
- Added to sidebar as the last entry.
- Replaces the old "curl with an access_token cookie" workflow from `PHASE1_NOTES`.

**Migration extended**
- `migrate-catalog` now derives `Product.options` from existing variants' color/size, mirrors `variant.color/size + variant.attributes` into `variant.optionValues`, and moves any legacy `product.attributes` into `product.specifications`. Idempotent.

**Smoke results**
- Pages render correctly. Public pages 200. Removed admin pages now caught by the auth gate (307 to login) rather than 404 — fine for an admin-only area.
- API `/api/product/details/<slug>` returns the new shape: `options[]` (from product or computed from legacy variants), `selectionValues`, `specifications[]`, plus legacy `axes/colors/sizes` for any callers not yet updated.
- Variant.color/size still readable for cart/order back-compat.

### Module 2 polish round (UX overhaul)

A follow-up review tightened the products workflow without breaking any APIs:

- **Product-level attributes (specifications)**: `Product.attributes[]` added with the same shape as variant attributes. Admins record static spec data (Material, Country of origin) on the product itself. Rendered as a Specifications table on the storefront product page below the description.
- **Generalised `AttributesEditor`** (`components/Application/Admin/AttributesEditor.jsx`) — accepts `scope='product'` or `'variant'`. Variant scope hides color/size; product scope shows the whole catalog. `VariantAttributesEditor` kept as a back-compat re-export.
- **Simpler `AttributeForm`** — primary fields shown (code, label, type, "creates variants", values). Advanced settings (unit, filterable, searchable, display order) collapsed into a defaulted-closed Accordion.
- **Inline variants on product edit (Shopify pattern)** — new `VariantsManager` shows a table of variants right inside the product edit page; new `VariantFormDialog` opens a modal for add/edit so admins never leave the product. Stock joined from inventory. Backed by `GET /api/product-variant/by-product/[id]`.
- **Sectioned product forms** — both Add and Edit reorganised into Cards: Basic info / Pricing / Media / Description / Specifications / Tags & SEO (+ Variants on edit). Add Product redirects to Edit after save so admins can immediately add variants.
- **Variant standalone edit page fixed** — was a copy-paste of the product edit page (genuine pre-existing bug). Rewritten as a proper variant editor.
- **Product list polish** — admin product table now shows a 48×48 thumbnail (computed via aggregation $lookup) and a Status chip column.

### Final cleanup sweep

After the Shopify-shaped redesign, removed every remaining orphan:

- Deleted `app/(root)/(admin)/admin/product-variant/{,add,edit/[id]}/page.jsx` — variants are managed inline on the product edit page (Shopify pattern), the standalone pages were duplicated UX and the broken edit page referenced now-deleted components.
- Removed `ADMIN_PRODUCT_VARIANT_ADD`, `ADMIN_PRODUCT_VARIANT_SHOW`, `ADMIN_PRODUCT_VARIANT_EDIT` constants from `routes/AdminPanelRoute.js`.
- Removed "Add Variant" + "Product Variants" submenu entries from the Products sidebar.
- Updated `lib/search.js` (admin command palette) — replaced the obsolete "Product Variant" entry with Brands / Inventory / Customer Groups / Roles / Maintenance entries to match the current sidebar.
- Dropped the deprecated `Product.attributes[]` and `ProductVariant.attributes[]` schema fields. Runtime no longer reads them; migration is defensive in case any old DB documents still carry the field.
- Deleted orphan infrastructure: `lib/AppError.js` and `lib/withApiHandler.js` (built in Phase 1 as opt-in handlers but never adopted by any route — current `response()`/`catchError()` pattern covers every route).
- `migrate-catalog` simplified to drop the legacy AttributeDefinition seeding step.

Variant API endpoints (`/api/product-variant/*`) kept because they're still used by the inline `VariantsManager`, the storefront `Filter.jsx` (colors/sizes), and the trash page.

### Auto-default variant pattern removed (final pass)

Followed up on a "does Shopify really require this" review. Shopify hides a default variant for single-SKU products as zero-friction UX — but for a white-label platform that any brand can deploy, *explicit* beats *invisible magic*. So:

- **`ProductVariant.isDefault` removed from the schema entirely.**
- Product create API no longer creates a hidden variant. Newly-created products are NOT purchasable until the admin explicitly adds a variant.
- Product details API no longer falls back to a default variant. When no variants exist, `variant: null` is returned and the storefront shows a clean "Out of stock" UX.
- `VariantsManager` simplified: dropped its dual-mode logic (Single-SKU panel vs. Variants table). Always shows the variants table. Empty state: *"No variants yet — product is not purchasable. Add the first variant."*
- `VariantFormDialog` works whether or not the parent product has options. With options → one dropdown per option. Without options → just SKU/price/media.
- Admin product list: "Variants" column now shows the simple variant count, with a warning chip *"None — not purchasable"* when zero.
- Admin variant list: dropped the Default/Custom "Type" column.
- Deleted `app/api/maintenance/seed-default-variants/route.js` and its card on `/admin/maintenance`.
- `migrate-catalog` extended to clean up any legacy `isDefault` variants in the DB — soft-deletes them where real variants exist for the same product (real ones survive); unsets the flag where it's the only variant (becomes a regular variant); then strips the `isDefault` field from every variant document.
- Storefront UX: "Currently Unavailable" → "Out of stock", helper text now reads *"This product isn't available right now. Check back soon."*

## Module 3 — Orders (shipped)

Orders are now a structured, multi-table model with explicit payment and fulfillment status axes, snapshotted line items, server-persisted cart, and refund/shipment lifecycle.

**New / changed models**

| Model | Purpose |
|---|---|
| `Cart` | Server-persisted cart. One row per `user` OR `guestToken`. Items carry a `priceSnapshot`. TTL index on guest carts. |
| `Order` (redesigned) | Adds `orderNumber` (human, `ORD-YYMMDD-XXXX`), `currency`, `taxAmount`, `shippingAmount`, `paymentStatus`, `fulfillmentStatus`, `paymentMethod` (`razorpay` / `cod` / `manual`), `channel`, `customerNote`, structured `shippingAddress` / `billingAddress` snapshots, and a richer `items[]` (variant snapshot — sku, name, image, optionValuesSnapshot, line totals). Legacy fields (`name/phone/...`, `products[]`, `payment_id`, `order_id`, `status`) are kept as readable for back-compat. |
| `OrderStatusHistory` | Append-only timeline. `statusType` = payment / fulfillment / order. Used by the order detail page on both sides. |
| `Payment` | One row per payment attempt. Mirrors Razorpay `order.id` + `payment.id`, captures `rawResponse`, `signatureVerified`, `capturedAt`. Webhook upserts into this. |
| `Refund` | One row per refund. `gatewayRefundId`, amount, reason, status (pending → processed via webhook). Partial refunds supported; sum capped at captured amount. |
| `Shipment` | One row per shipment carrying `items[]` (sku snapshots). Carrier, tracking number, tracking URL, status. Delivering the last open shipment flips the order to `fulfilled`. |
| `Invoice` | Invoice metadata (number + PDF URL). Scaffolded for a later PDF job; nothing writes here yet. |

`lib/utils.js` exports `paymentStatus`, `fulfillmentStatus`, and `deriveLegacyOrderStatus()` so the legacy combined `status` field stays synchronized with the new split axes (dashboards/widgets that read it keep working).

**Cart APIs (`/api/cart/*`)**

| Method | Path | Notes |
|---|---|---|
| GET | `/api/cart` | Resolves owner from auth or `cart_token` cookie. Auto-creates if absent and issues a 30-day guest cookie on first contact. Returns hydrated items with stock + unavailable flags. |
| POST | `/api/cart/add` | `{ productId, variantId, qty }`. Captures `priceSnapshot` at add time. |
| PUT | `/api/cart/update` | `{ variantId, qty }`. `qty=0` removes the line. |
| POST | `/api/cart/remove` | `{ variantId }` |
| POST | `/api/cart/clear` | clears items + coupon. |
| POST | `/api/cart/coupon` | persist a tentative coupon code on the cart. |
| POST | `/api/cart/merge` | call once right after login — picks up guest cookie, merges into user cart (qty sums, capped at 99), clears guest cart + cookie. |

`/api/cart-verification` is **deleted**. The hydrated cart already exposes per-item `stock`, `unavailable`, and `unavailableReason`.

**Order/payment APIs**

- `POST /api/payment/get-order-id` — now server-authoritative. Reads the live cart, refuses if anything is unavailable, computes the amount itself (client can no longer under-pay by lying about the cart).
- `POST /api/payment/save-order` — new payload: `{ email, addressId | shippingAddress, customerNote, couponCode, couponDiscountAmount, paymentMethod, razorpay_* }`. Branches on `paymentMethod`:
  - **`razorpay`** (default): verifies signature, opens order with `paymentStatus=paid`, creates a Razorpay Payment row with `status=captured`. On signature mismatch the order is still recorded but with `paymentStatus=failed` + `fulfillmentStatus=cancelled` so finance has a paper trail.
  - **`cod`**: skips gateway verification, opens order with `paymentStatus=pending`, creates a `cod` Payment row with `status=created`. The order is still considered committed — inventory is reserved and the cart is cleared. Admin marks the cash collected on delivery.
  Both paths snapshot the address, decrement inventory (`$inc reserved`), clear the cart, burn the guest cookie, and write payment + fulfillment history rows.
- `POST /api/orders/mark-cod-paid` — admin endpoint. Flips the COD Payment row → `captured` and Order.paymentStatus → `paid`. Validates that the order is actually a COD order in `pending` state. Writes a history entry.
- `POST /api/payment/webhook/razorpay` — extended to handle `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`. Upserts the Payment row, transitions order status, and on full-amount refunds flips Order.paymentStatus → `refunded` (partial → `partially_refunded`).
- `PUT /api/orders/update-status` — admin status update. Accepts `paymentStatus` and/or `fulfillmentStatus` + a free-form note. Writes one history row per axis that changed.
- `POST /api/orders/refund` — Razorpay payments → calls the gateway and creates a `pending` Refund row (webhook flips to `processed`). COD / manual payments → records the Refund row immediately as `processed` and flips the parent Payment status — no gateway call. Sum of refunds is capped at the captured amount.
- `POST /api/orders/shipment` — create a shipment (sku snapshots). First shipment flips the order to `partial`. `PUT /api/orders/shipment` updates carrier / tracking / status; delivering the last open shipment flips fulfillment to `fulfilled`.
- `GET /api/orders/get/[orderid]` — accepts the new orderNumber, the legacy `order_id`, or the Mongo `_id`. Returns `{ order, payments, refunds, shipments, statusHistory }`.
- `GET /api/admin/refunds`, `GET /api/admin/shipments` — paginated list endpoints feeding the new admin tables.

**Migration**

`/api/maintenance/migrate-orders` is idempotent. Per existing order it:
1. Assigns `orderNumber` if missing (retry on collision).
2. Builds `shippingAddress` + `billingAddress` snapshots from the flat legacy fields.
3. Converts `products[]` → `items[]` with a best-effort variant snapshot (sku, image, optionValues).
4. Derives `paymentStatus` + `fulfillmentStatus` from the legacy `status`.
5. Sets `paymentMethod` — `razorpay` when a `payment_id` exists, otherwise `cod`.
6. Creates the matching Payment row (Razorpay row when `payment_id` exists, otherwise a `cod` row in the appropriate state).
7. Seeds three OrderStatusHistory rows so the timeline isn't empty for migrated orders.

Run it from `/admin/maintenance` after deploying Module 3.

**Frontend**

- Cart redux slice rewritten as a server-synced facade. `addToCartAsync`, `updateCartQty`, `removeFromCartAsync`, `clearCartAsync`, `applyCartCoupon`, `mergeGuestCart`, `fetchCart` — every action POSTs to `/api/cart/*` and the slice caches the server response. `CartHydrator` (mounted at the website layout root) auto-fetches on first render and triggers a merge on login.
- `/checkout` rewritten: address picker for logged-in users (sourced from Module 1 Address book), inline form for guests / "use a different address", coupon UI persisted to cart, **payment-method radio (Pay online / Cash on delivery)**, server-authoritative Razorpay init, address snapshot at order time. COD path skips the gateway popup and posts straight to `save-order`.
- `/order-details/[orderid]` (storefront) rebuilt around the new response shape: status pills, line items with option-value snapshots, summary with optional tax/shipping/coupon, shipment tracking section, full timeline.
- `/orders` list shows orderNumber + payment / fulfillment pills + item count.
- Admin order list switched to orderNumber/payment/fulfillment columns (removed the flat-address columns).
- Admin order detail rebuilt: refund dialog, shipment-create dialog, per-shipment status buttons, refund table, full timeline. Split payment+fulfillment selects with optional admin note. For COD orders awaiting collection, a **Mark cash collected** action is surfaced alongside Refund / Create shipment.
- Storefront order details now surfaces the payment method (and, for unpaid COD orders, a prompt: *"Pay ₹X on delivery"*). Admin order detail's Customer card also shows the chosen method.
- New admin pages: `/admin/refunds`, `/admin/shipments` (datatable + view-link back to the order).
- Sidebar Orders entry is now a submenu (All Orders / Shipments / Refunds).

**What still uses the legacy fields**

For pre-Module-3 orders, the storefront/admin order detail fall back to the flat `name/phone/city/...` fields when the `shippingAddress` snapshot is absent. Once `migrate-orders` runs once on prod, the fallback path becomes dead code (it can be removed later).

## Module 3 — Returns, exchanges & lifecycle emails (final pass)

After the COD pass, Module 3 was extended with customer-initiated returns/exchanges and a full lifecycle-email system. One bug was fixed in the checkout flow.

### Bug fix — saved-address checkout

The saved-address path called `orderForm.handleSubmit(submitOrder)`, but the inline form's zod schema requires `phone`, `line1`, `city`, `state`, `country`, `pincode` — which are empty when the user is picking a saved address. handleSubmit silently aborted and the **Place order** button did nothing (for both online and COD).

Fix: the saved-address button now calls `submitOrder({ customerNote })` directly, bypassing form validation. The saved-address block also got its own optional **Order note** textarea so customers can leave delivery instructions without filling the full inline form.

### Returns / exchanges

**Model `Return`**

| Field | Meaning |
|---|---|
| `returnNumber` | Human-friendly `RET-YYMMDD-XXXX` |
| `order`, `user` | Refs |
| `type` | `return` (refund) or `exchange` (replacement) |
| `items[]` | sku snapshots + qty + reason (subset of an order's line items) |
| `status` | `requested → approved/rejected → received → refunded/replaced`, or `cancelled` while still `requested` |
| `requestNote`, `adminNote` | Customer + admin notes (used in the emails) |
| `refund`, `replacementShipment` | Backreferences set when those follow-on actions happen |
| timestamps | `requestedAt`, `approvedAt`, `receivedAt`, `completedAt` |

**Eligibility** is computed by `lib/orders.isReturnEligible(order)`:
- order must be `fulfillmentStatus=fulfilled`
- order must not be already `paymentStatus=refunded`
- delivery must be within `RETURN_WINDOW_DAYS` (env, default 7) of today

**Customer APIs**
- `GET /api/account/returns` — list user's returns
- `POST /api/account/returns` — submit a new request (validates eligibility + that each `sku` actually exists on the order with at least the requested qty)
- `GET /api/account/returns/[id]` — fetch detail
- `POST /api/account/returns/[id]/cancel` — cancel while still `requested`

**Admin APIs**
- `GET /api/admin/returns` — paginated list (for the datatable)
- `GET /api/admin/returns/[id]` — populated detail
- `PUT /api/admin/returns/[id]` — `{ action: 'approve' | 'reject', adminNote }`
- `POST /api/admin/returns/[id]/mark-received` — flips `approved → received`
- `POST /api/admin/returns/[id]/refund` — issues the refund (Razorpay or manual, capped at remaining captured), creates the Refund row, transitions the Order's paymentStatus, moves return → `refunded`
- `POST /api/admin/returns/[id]/replacement` — for exchanges; creates a new Shipment (sku snapshots from the return), links it onto the return, moves return → `replaced`

**Storefront**
- `/returns` — list (account-panel layout)
- `/returns/[id]` — detail with self-cancel for `requested`
- `/returns/request/[orderid]` — request form with type picker (return/exchange), per-item qty/reason, optional note
- Order details page surfaces a **Request return / exchange** pill when eligible, and a small line noting the return window
- Account panel sidebar gains a **Returns** entry

**Admin**
- `/admin/returns` — datatable
- `/admin/returns/[id]` — detail with Approve / Reject / Mark items received / Issue refund / Create replacement actions and decision dialogs
- Sidebar Orders submenu gains **Returns**

### Lifecycle emails

`email/_layout.js` — shared layout (header, CTA button, summary helpers, address block). All inline CSS — Gmail/Outlook strip `<style>` blocks.
`email/orderEvents.js` — per-event templates that compose the layout.
`lib/orderEmails.js` — best-effort wrappers; every email goes through `safe()` which logs and swallows so a mail-server hiccup never blocks the underlying operation.

| Event | Wired into | Template |
|---|---|---|
| Order confirmation (online or COD) | `POST /api/payment/save-order` | `orderConfirmationEmail` |
| Order shipped (incl. exchange replacement) | `POST /api/orders/shipment`, `POST /api/admin/returns/[id]/replacement` | `orderShippedEmail` |
| Order delivered | `PUT /api/orders/shipment` (last delivered), `PUT /api/orders/update-status` (fulfillmentStatus=fulfilled) | `orderDeliveredEmail` |
| Order cancelled | `PUT /api/orders/update-status` (fulfillmentStatus=cancelled), webhook payment.failed | `orderCancelledEmail` |
| COD cash collected | `POST /api/orders/mark-cod-paid` | `codCollectedEmail` |
| Refund processed | manual leg of `POST /api/orders/refund`, webhook `refund.processed`, manual leg of `POST /api/admin/returns/[id]/refund` | `refundProcessedEmail` |
| Return requested | `POST /api/account/returns` | `returnRequestedEmail` |
| Return approved / rejected | `PUT /api/admin/returns/[id]` | `returnApprovedEmail` / `returnRejectedEmail` |
| Return received | `POST /api/admin/returns/[id]/mark-received` | `returnReceivedEmail` |

The old monolithic `email/orderNotification.js` was deleted — no consumers left.

### Env additions

- `NEXT_PUBLIC_BRAND_NAME` (optional) — header label in every email AND the invoice PDF. Defaults to "E-store".
- `NEXT_PUBLIC_BRAND_ADDRESS` (optional) — printed below the brand name on invoice PDFs.
- `NEXT_PUBLIC_BRAND_GSTIN` (optional) — printed under address on invoice PDFs.
- `NEXT_PUBLIC_RETURN_ADDRESS` (optional) — shown in the "return approved" email's ship-to block. If unset the email asks the customer to wait for a follow-up.
- `RETURN_WINDOW_DAYS` (optional) — return window in days. Defaults to 7.

### Official invoices (PDF)

`pdfkit` (~700 KB, pure JS) renders the invoice in memory at download time — no disk I/O, no Cloudinary upload.

> **Build config:** `next.config.mjs` lists `pdfkit` in `serverExternalPackages`. Without this, Turbopack / Webpack bundle pdfkit's source and break the runtime lookup of its built-in AFM font files (`ENOENT: data/Helvetica.afm`). The flag tells Next to leave pdfkit as a runtime require from `node_modules` so its internal `fs.readFileSync` calls find their fonts.

**Lifecycle**
- Invoice row is created idempotently when payment captures:
  - Online: inside `save-order` on signature verify, AND again in the `payment.captured` webhook (no-op on second call). Belt + suspenders.
  - COD: inside `mark-cod-paid` when the admin records cash collection.
  - Legacy: `migrate-orders` seeds an `Invoice` row for any order whose derived `paymentStatus` is `paid`.
- `invoiceNumber` format: `INV-YYMMDD-XXXX` (Crockford 8-char NanoID suffix, unique sparse index).

**Download endpoint**
`GET /api/invoice/[orderRef]/download` (Node runtime):
- Authorization: admin (any), the order's `user`, OR a guest whose `cart_token` cookie matches the order's `guestToken`.
- Refuses with 400 when `paymentStatus` is not paid / refunded / partially_refunded — no invoice exists until money's been collected.
- Returns `application/pdf` with `Content-Disposition: attachment; filename="<invoiceNumber>.pdf"`.

**Where the button appears**
- Storefront order detail — header chip + Summary card row with invoice number + Download PDF.
- Storefront orders list — per-row `Invoice ↓` link when `hasInvoice` is true.
- Admin order detail — header action button + Summary card row.

The Invoice PDF renders: brand header, invoice meta, bill-to/ship-to, items table with SKU + option snapshots, summary with discount/coupon/tax/shipping/total, payment block with gateway reference + capture timestamp, and a computer-generated-on footer.

## Module 4 — Marketing (shipped)

Coupons v2 (Shopify-shaped), labeled Campaigns that group coupons, and a double-opt-in newsletter list with a reusable subscribe component the future CMS will pick up.

### Models

| Model | Purpose |
|---|---|
| `Coupon` (extended) | Discount type (percentage/fixed), value, max-discount cap, min order value, total + per-user usage limits, applicable categories/products, excluded products, customer groups, first-order only, validity window, status, automatic + stackable flags, campaign backref. Legacy `discountPercentage` / `minShoppingAmount` / `validity` kept readable. |
| `CouponRedemption` | Append-only log of every successful redemption — used to enforce per-user limits and to power redemption analytics. Soft-delete intentionally NOT applied (cancelled orders don't unwind the count by default). |
| `Campaign` | Labeled marketing activity (`promo` / `email` / `banner` / `mixed`) with dates, status, targeting, and a `coupons[]` list. Save/PUT keeps `Coupon.campaign` backrefs in sync both ways. |
| `Subscriber` | Newsletter list. Double-opt-in via `verificationToken` + one-click unsubscribe via `unsubscribeToken`. Statuses cover bounced/complained for future ESP feedback loops. |

### Server-authoritative discount math

`lib/coupons.js` is the single source of truth.

- `resolveCoupon({ code, cartItems, userId, subtotalHint })` runs in one pass: status + validity window, total `usageLimit`, per-user `usagePerUser` (counts `CouponRedemption` rows), customer-group targeting, `firstOrderOnly`, per-line scope (`applicableCategories` / `applicableProducts` / `excludedProducts`), min order value, then computes `discountAmount` (percentage with optional cap, or fixed). Returns `{ ok, discountAmount, applicableSubtotal, reason? }`.
- `recordCouponRedemption(...)` is the post-order write — creates the log row + atomic `$inc` on `Coupon.usageCount`.

Both `/api/coupon/apply` and `/api/payment/save-order` call `resolveCoupon` themselves. The checkout client receives `discountAmount` from the server and stores it as-is — there is no client-side discount math anymore.

### Endpoints

**Coupons**
- `GET /api/coupon` (admin paginated, projects new fields with `$ifNull` fallbacks to legacy)
- `POST /api/coupon/create`, `PUT /api/coupon/update`, `GET /api/coupon/get/[id]`
- `POST /api/coupon/apply` (storefront, server-authoritative)

**Campaigns**
- `GET/POST/PUT/DELETE /api/admin/campaign`
- `GET /api/admin/campaign/[id]` with populated `coupons`

**Newsletter**
- `POST /api/newsletter/subscribe` — rate-limited (AUTH_BURST preset), idempotent across all subscriber states
- `GET /api/newsletter/confirm?token=…` — sets `verifiedAt`, sends welcome email
- `GET /api/newsletter/unsubscribe?token=…` — one-click via email
- `POST /api/newsletter/unsubscribe` — form-based fallback (`{ email }`)
- `GET /api/admin/newsletter` paginated, `GET /api/admin/newsletter/export` CSV

**Migration**
- `POST /api/maintenance/migrate-coupons` — mirrors legacy fields into new ones, defaults `discountType=percentage`, sets `startsAt=createdAt`, sets `usageCount=0`, auto-expires past-end-date coupons.

### Frontend

- `components/Application/Admin/CouponForm.jsx` — shared sectioned form (Code / Discount / Validity / Order requirements / Usage limits / Scope / Targeting). Uses live `/api/category/tree`, `/api/admin/customer-groups`, and `/api/product` search.
- `components/Application/Admin/CampaignForm.jsx` — shared form (Campaign / Schedule / Targeting / Linked coupons).
- Admin pages: `/admin/coupon` (extended list), `/admin/coupon/add`, `/admin/coupon/edit/[id]`, `/admin/campaign`, `/admin/campaign/add`, `/admin/campaign/edit/[id]`, `/admin/newsletter`.
- Sidebar Marketing submenu replaces the old standalone "Coupons" entry.
- `components/Application/Website/NewsletterSubscribe.jsx` — reusable block (variants `inline` / `stacked`, `source` attribution). Mounted in the Footer; ready as-is for the Module 7 CMS `newsletter` block.
- New shared `components/ui/switch.jsx` (radix-switch wrapper) for the form toggles.
- New email templates: `email/newsletterEvents.js` (`newsletterConfirmEmail`, `newsletterWelcomeEmail`).

### Edge cases handled

- Tampered checkout: even if the client posts a fake `couponCode` + `couponDiscountAmount`, save-order re-runs `resolveCoupon` and only uses the server's computed amount.
- Per-user limit: counted from `CouponRedemption.coupon=this, user=this`. Guests skip this check (still subject to global `usageLimit`).
- Customer-group targeting: when set, an authenticated user's `customerGroup` must match — non-matching users get "This coupon is not available for your account."
- First-order only: requires a logged-in user with zero paid orders; guests get a clear "please log in" message.
- Scope: empty `applicableCategories[]` / `applicableProducts[]` ⇒ "all" (Shopify convention). `excludedProducts[]` always wins.
- Min order value: checked against the cart's full subtotal hint when provided.
- Failed online orders DO NOT burn a redemption — `recordCouponRedemption` only fires on `verified` (online) or COD path.
- Subscribe is idempotent across all states (new / unverified / verified / previously-unsubscribed) — re-submissions re-arm the verification token.
- Unsubscribe responses are intentionally generic ("If that email is on our list…") so the endpoint can't be used to enumerate the list.

## Module 6 — Messaging / support (shipped)

Customer ↔ support conversations with internal admin notes, public contact form (auto-broadcast to admins), in-app notification bell with light polling, and DB-backed email templates that override the hardcoded `email/orderEvents.js` defaults without losing the safety net.

### Models

| Model | Purpose |
|---|---|
| `Conversation` | Two-party thread. Subject + status/priority/assignedTo + denormalised lastMessageAt / preview / by + unread flags (per-party) + messagesCount. Optional `relatedOrder` / `relatedReturn` / `relatedProduct` for context. |
| `Message` | One row per message. `authorRole` (customer/admin/support/system), `body`, `attachments[]`, `isInternal` (admin-only note), `readByCustomer` / `readByAdmin`. |
| `ContactSubmission` | Public "Contact us" form. `status` (new/in_progress/resolved/spam), `conversation` backref once converted. |
| `Notification` | In-app bell. `audienceRole` segregates user vs admin. TTL index on `readAt` auto-prunes read notifications after 90 days. |
| `EmailTemplate` | Admin-editable override. `code` + `locale` unique. When inactive, callers fall back to the hardcoded file template. `variables[]` is doc-only. |

### Server-side helpers

- `lib/notifications.js` — `emitNotification(...)` + `emitAdminBroadcast(...)`. Best-effort: storage failures never break the underlying flow.
- `lib/conversations.js` — `appendMessage(...)` writes the Message, bumps the conversation summary, flips the OTHER party's unread, and re-opens resolved/closed threads when the customer replies.
- `lib/emailTemplates.js` — `interpolate(template, data)` (Handlebars-lite, supports `{{var}}` and `{{nested.path}}`) + `renderTemplate(code, data)`. `EVENT_CATALOG` documents every event code + variables for the admin UI.
- `lib/orderEmails.js` (rewritten) — each helper calls `dispatch(code, to, fallbackSubject, fallbackBody, data)` which tries the DB template first and falls back to the hardcoded `email/orderEvents.js` renderer. Token names are a stable public contract: `order.*`, `customer.*`, `urls.*`, `shipment.*`, `refund.*`, `return.*`, `reason`.

### Endpoints

**Conversations**
- `GET/POST /api/support/conversations` — customer's own
- `GET /api/support/conversations/[id]` — auto-marks read, filters internal notes
- `POST /api/support/conversations/[id]/messages`
- `GET /api/admin/support` — datatable feed
- `GET/PUT /api/admin/support/[id]` — full message list incl. internal notes
- `POST /api/admin/support/[id]/messages` — admin reply, `isInternal` toggle

**Contacts**
- `POST /api/contact/submit` — rate-limited, broadcasts to admins
- `GET /api/admin/contacts`, `GET/PUT /api/admin/contacts/[id]`
- `POST /api/admin/contacts/[id]/convert` — promotes to Conversation when the email matches a customer account

**Notifications**
- `GET /api/notifications?limit=N&unread=1`
- `GET /api/notifications/unread-count` — returns `{ unreadCount: 0 }` 200 even for guests so the bell stays silent without an auth error
- `POST /api/notifications/mark-read` — `{ ids: [...] }` or `{ all: true }`

**Email templates**
- `GET/POST /api/admin/email-templates`, `GET/PUT /api/admin/email-templates/[id]`
- `POST /api/admin/email-templates/preview` — server renders with sample data from the event catalog

### Frontend

- **Storefront notification bell** (`components/Application/Website/NotificationBell.jsx`) — mounted in the Header. Polls `/api/notifications/unread-count` every 30s while the tab is visible. Click opens a dropdown with the latest 10 + "Mark all read" + per-notification action links. Click-outside closes.
- **`/account/messages`** — list with status pills, unread highlighting, time-ago timestamps, "New conversation" CTA.
- **`/account/messages/[id]`** — chat-style detail with bubble layout, avatar circles, status pill, light 20s polling, scroll-pinned, ⌘/Ctrl+Enter to send. "Resolved → reply re-opens" hint when applicable.
- **`/account/messages/new`** — form supporting `?order=<orderRef>` for context-linked threads.
- **`/contact-us`** — split-layout form with brand contact info side panel and a clean confirmation state.
- **Order detail "Contact support" chip** — added alongside Request return / Download invoice so customers always have a one-click path to start a thread linked to that order.
- **Account-panel sidebar** gains a **Messages** entry.
- **Admin `/admin/support`** — datatable with bold subject for admin-unread rows. Detail page has the same chat UI plus a right rail with customer card + status/priority selects (auto-save) + an internal-note toggle that switches the textarea to amber styling so the modes can't be confused.
- **Admin `/admin/contacts`** — datatable + per-submission detail with status select, **Convert to ticket**, and a fallback "Reply by email" mailto link.
- **Admin `/admin/email-templates`** — list showing every event code with one of three states (Active / Draft / File fallback). "Create override" seeds + opens the editor. Editor has subject + HTML body, active toggle, sticky variable-reference panel, and a **Preview with sample data** action that renders into an isolated iframe.
- **Admin sidebar** gains a **Support** submenu (Inbox / Contact submissions / Email templates).

### Notifications wired into lifecycle events

| Event | Customer | Admin |
|---|---|---|
| Order placed | "Order ORD-… confirmed" | "New order placed" |
| Shipment created | "Order ORD-… shipped via {carrier}" | — |
| Last shipment delivered | "Order ORD-… delivered" | — |
| Refund processed (manual leg) | "Refund processed" | — |
| Return approved / rejected | "Return approved/not approved" | — |
| New conversation / customer reply | — | "New support conversation / customer reply" |
| New contact form submission | — | "New contact form submission" |
| Admin reply on conversation | "New reply from support" | — |

### Edge cases handled

- **Polling, not push** — websockets out of scope. 30s bell polling, 20–30s conversation polling. Skips when tab is hidden.
- **Auto-re-open closed threads** — `appendMessage` flips `resolved`/`closed` → `open` when the customer replies.
- **Internal notes never leak** — customer GET filters `isInternal=true`. Admin view renders them in an amber card.
- **Read receipts** — fetching a conversation marks the requester's side read in a batched `updateMany`. Customer-unread and admin-unread are independent.
- **Contact → ticket needs an account** — clear "reply by email instead" message when the email doesn't match.
- **DB template hot-swap** — toggling active/inactive immediately changes what the next outbound email uses. The hardcoded file templates are the safety net.

## Module 5 — Reviews (shipped)

Moderated product reviews with verified-buyer detection, helpful votes, customer-driven reports with an auto-flip-to-pending threshold, admin replies rendered inline, and customer-side photo uploads via a direct Cloudinary signed-upload widget.

### Models

| Model | Purpose |
|---|---|
| `Review` (extended) | `order` (the verifying order, snapshotted), `mediaUrls[]`, `verifiedBuyer`, `status` (`pending` / `approved` / `rejected`), `rejectionReason`, `helpfulCount` + `helpfulVoters[]`, `reportedCount` + `reportedBy[]`, `reply{ by, byName, text, at }`. Indexes on `(product, status, createdAt)` and `(user, product)`. |

### Server-side helpers

`lib/reviews.findVerifyingOrder({ userId, productId })` — returns `{ ok, orderId }` when the user has a `paid`/`partially_refunded`/`refunded` order whose fulfillment is `fulfilled` or `partial` containing the product. Used both at review-create time AND by `/api/review/can-review` so the storefront can hint *"You bought this — your review will be marked verified."*

### Endpoints

**Public**
- `GET /api/review/get?productId=&page=&sort=` — returns approved + the caller's own (any status) so users see their pending/rejected moderation state. Sort: `most_helpful` (default), `newest`, `highest`, `lowest`, `with_photos`, `verified`. Each row includes `isMine` + `helpfulByMe`.
- `GET /api/review/details?productId=` — summary: count, average, per-star distribution + percentage, `withPhotos` count, `verifiedCount`. Approved only.
- `GET /api/review/can-review?productId=` — `{ authed: false }` for guests, `{ existingReview }` when the customer already has one (so the CTA flips to Edit), or `{ canReview: true, verified }`.
- `POST /api/review/[id]/helpful` — toggles vote (auth required), dedupes via `$addToSet`/`$pull`, count derived from array length so it can never drift.
- `POST /api/review/[id]/report` — auth required. Crossing `REVIEW_REPORT_THRESHOLD` (env, default 3) flips an approved review back to `pending` and broadcasts a notification to admins.

**Auth + admin**
- `POST /api/review/create` — sets `verifiedBuyer` automatically via the helper. One-review-per-(user, product); resubmits update the existing row and flip status to `pending`. Broadcasts a moderation notification.
- `GET /api/review` (admin list) — extended projection: `status`, `verifiedBuyer`, `reportedCount`, `helpfulCount`, `hasReply`.
- `GET /api/admin/reviews/[id]` — full detail with populated user + product.
- `PUT /api/admin/reviews/[id]` — single endpoint with `{ action: 'approve' | 'reject' | 'reply', rejectionReason?, replyText? }`. Each action sends a customer email (uses `email/_layout.js` for consistency with the rest of the lifecycle emails) AND emits an in-app notification.

### Frontend

- **Storefront `ProductReveiw` rebuilt** — summary card with avg rating, per-star distribution bars (using existing `Progress` component), verified-buyer count, and a context-aware CTA that flips between "Log in" / "Write a review" / "Edit your review" with pending/rejected hints. Sort dropdown above the list. Infinite-scroll via "Load more" (TanStack `useInfiniteQuery`). Each `ReviewList` row shows a verified-buyer chip when applicable, a photo grid, the admin reply card (left-border block), a Helpful button that highlights the user's own vote, and a Report button (hidden on own reviews). The customer's own pending/rejected reviews show an inline moderation pill.
- **Write review dialog** — 5-star clickable rating, title + body, and the `ImageUploader` component. Submits to `/api/review/create`; success goes back to pending moderation.
- **`ImageUploader` (new, reusable)** — customer-facing widget. Uses a native `<input type="file">` + direct signed POST to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`. Bypasses `CldUploadWidget` entirely because its portal conflicts with Radix Dialog's outside-click handling. Per-file progress UI, 5-photo cap, PNG/JPG/WebP only, 8 MB each, removable thumbnails. Reusable for any future customer-facing form that needs photos (returns, support, CMS).
- **Admin `/admin/review` list** — new chips: rating stars, status, Verified, Reports count, Replied. View action goes to the per-review detail.
- **Admin `/admin/review/[id]` detail** — full review with media, audit chips at the top (Status / Verified / Reports / Helpful), 3-button moderation panel: Approve (one-click), Reject (opens a dialog with required reason), Reply (opens a dialog with the staff-response body). Each action notifies the customer via email + in-app bell.
- **Admin sidebar** — single **Reviews** entry.

### Edge cases handled

- **One review per (user, product)** — a second submission updates the existing row and returns it to `pending` for re-moderation. Avoids cluttering the moderation queue with duplicates.
- **Verified buyer is informational, not a gate** — non-buyers can still review; they just don't get the badge.
- **Customer sees their own moderation state** — pending and rejected reviews are returned to the caller only, never to others. Rejected reviews carry the admin's reason in the inline pill (and were sent by email at reject time).
- **Helpful vote idempotent** — `helpfulVoters[]` is the source of truth; `helpfulCount` is rebuilt from `length` on every toggle, so the counter can never drift.
- **Report threshold safety valve** — once `REVIEW_REPORT_THRESHOLD` distinct users (env, default 3) report a review, it flips back to `pending` and the admins get a bell broadcast.
- **Photo uploads bypass the admin Media library** — the admin's `MediaModal` is library-picker UI for admin-managed assets only; customers don't have access. `ImageUploader` does its own signed upload so review media is owned by the review itself, not promoted to the admin library.
- **Dialog + upload coexistence** — direct file input avoids the portal collision that `CldUploadWidget` has with Radix Dialog (where clicking inside the widget was being interpreted as "outside the dialog" and dismissing the parent).

## Known, deliberately deferred (need external services or per-module work)

These remain pending because they require infrastructure outside the app:

- **Background jobs (BullMQ on Redis)** — needs a Redis instance. Email sending stays synchronous for now; logger captures any failure.
- **Cache layer (Redis)** — needs a Redis instance. ISR + Next built-in cache cover the basics until Redis is available.
- **Search (Meilisearch)** — needs a Meilisearch instance. Existing `fuse.js` works for small catalogs; swap when catalog crosses ~10k items.
- **Observability (Sentry)** — needs a Sentry account. `lib/logger.js` already centralizes errors and is the only place that needs an integration hook.
- **Service / repository split** — pure code refactor; will be adopted per feature module as each one ships (starting with Module 2 — Products).

## Smoke results — Module 0 verification

| Check | Expected | Got |
|---|---|---|
| `/`, `/shop`, `/auth/login`, `/auth/register` | 200 | 200 |
| Product page `/product/test-prod` | 200 + markers visible | ✓ |
| `POST /api/auth/login` with empty body | **HTTP 401** (was 200 before fix) | 401 ✓ |
| `POST /api/auth/register` with empty body | **HTTP 401** (was 200) | 401 ✓ |
| `GET /admin/dashboard` (no token) | 307 → /auth/login | 307 ✓ |
| `POST /api/payment/webhook/razorpay` (no signature) | 400 or 500 | 500 (secret unset) ✓ |
| `GET /this-path-does-not-exist` | **HTTP 404** (was 200) + styled "Page not found" body | 404 + body rendered ✓ |
| `GET /api/product/details/nonexistent` | **HTTP 404** (was 200) | 404 ✓ |
| Rate limit: 6 rapid `POST /api/auth/login` | requests 1-5 → 401, req 6 → 429 | matched ✓ |

Note: SSR pages fetch their own API via `NEXT_PUBLIC_API_BASE_URL`. If you
run dev on a different port (e.g. when 3000 is busy), set
`NEXT_PUBLIC_API_BASE_URL` to match, or the home page's `FeaturedProduct`
and product detail page will fail with `ECONNREFUSED`. This is a
pre-existing fragility unrelated to Module 0.
