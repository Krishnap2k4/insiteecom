# Frontend Documentation

The frontend is the customer-facing portion of the application. It is built with Next.js App Router and serves the public storefront, the authenticated account experience, and the checkout journey.

## 1. Frontend responsibility

The frontend is responsible for:

- rendering store pages such as home, shop, category, brand, and product detail views,
- rendering cart and checkout flows,
- displaying account and order-related information,
- handling user interactions with wishlist, addresses, contact forms, newsletter subscription, and returns,
- calling the backend APIs and presenting their results to the user.

## 2. Frontend structure

### Route groups

- [app/(root)/(website)](../../app/(root)/(website)) contains the public and customer-facing pages.
- [app/(root)/(admin)](../../app/(root)/(admin)) contains the protected admin interface.
- [app/layout.jsx](../../app/layout.jsx) is the app-wide root layout.
- [app/globals.css](../../app/globals.css) contains global styles.

### Major frontend folders

- [components](../../components): reusable components for the site and admin experience
- [components/ui](../../components/ui): shared UI primitives and design-system components
- [components/Application](../../components/Application): application-specific reusable building blocks
- [hooks](../../hooks): reusable hooks for fetch logic, auth, layout behavior, and settings
- [store](../../store): Redux slices and state setup
- [public](../../public): static assets, images, icons, and downloadable content

## 3. Public storefront pages

The website surface includes pages for:

- home and landing experiences,
- shop listing and product browsing,
- category pages under the hierarchical category route pattern,
- brand landing pages,
- product detail pages with variant selection and add-to-cart support,
- cart and checkout,
- policy and informational pages,
- contact, returns, and support flows.

Some of the route areas include:

- [app/(root)/(website)/about-us](../../app/(root)/(website)/about-us)
- [app/(root)/(website)/cart](../../app/(root)/(website)/cart)
- [app/(root)/(website)/checkout](../../app/(root)/(website)/checkout)
- [app/(root)/(website)/product](../../app/(root)/(website)/product)
- [app/(root)/(website)/shop](../../app/(root)/(website)/shop)
- [app/(root)/(website)/wishlist](../../app/(root)/(website)/wishlist)
- [app/(root)/(website)/addresses](../../app/(root)/(website)/addresses)
- [app/(root)/(website)/my-account](../../app/(root)/(website)/my-account)

## 4. UI stack and styling conventions

The frontend uses:

- Tailwind CSS for layout and utility-driven styling,
- shadcn-style primitives in [components/ui](../../components/ui),
- Material UI components where richer interactive elements are needed,
- reusable application-level components in [components/Application](../../components/Application).

The styling approach is component-oriented, with global design tokens and app-wide styling handled through [app/globals.css](../../app/globals.css).

## 5. State management

The frontend uses a hybrid state model:

- Redux for shared application state such as cart and wishlist state,
- Redux Persist to preserve certain state between reloads,
- React Query for data fetching and mutation-driven UI updates,
- local component state for form fields and temporary UI states.

This allows the app to avoid excessive prop drilling while still keeping UI interactions fast and predictable.

## 6. Routing and navigation helpers

The frontend uses centralized route helpers in [routes/WebsiteRoute.js](../../routes/WebsiteRoute.js) for:

- homepage and shop routes,
- product detail URLs,
- category and brand URLs,
- order detail and returns routes,
- user account routes.

This prevents route strings from being duplicated across the app.

## 7. Authentication and route protection

Public and protected routes are influenced by [middleware.js](../../middleware.js).

The middleware:

- inspects request paths,
- forwards pathname information via headers,
- redirects unauthenticated users away from account and admin areas,
- redirects authenticated users from auth pages to the appropriate dashboard.

## 8. Shared frontend hooks

The app includes helpful hooks under [hooks](../../hooks):

- [hooks/useFetch.js](../../hooks/useFetch.js): fetch/data access patterns
- [hooks/useRequireAuth.js](../../hooks/useRequireAuth.js): auth-gated access helpers
- [hooks/use-mobile.js](../../hooks/use-mobile.js): responsive behavior helpers
- [hooks/useSiteSettings.js](../../hooks/useSiteSettings.js): site settings access

These hooks centralize common frontend behavior and make it easier to maintain consistent UX logic.

## 9. How frontend features are typically implemented

A typical website feature follows this pattern:

1. create or update a page under [app/(root)/(website)](../../app/(root)/(website)),
2. add or reuse components in [components](../../components),
3. call the relevant API route under [app/api](../../app/api),
4. manage local or global state as needed,
5. use the existing response conventions from [lib/helperFunction.js](../../lib/helperFunction.js).

## 10. Important frontend files

- [app/layout.jsx](../../app/layout.jsx)
- [app/globals.css](../../app/globals.css)
- [middleware.js](../../middleware.js)
- [routes/WebsiteRoute.js](../../routes/WebsiteRoute.js)
- [lib/apiClient.js](../../lib/apiClient.js)
- [hooks/useFetch.js](../../hooks/useFetch.js)
- [hooks/useRequireAuth.js](../../hooks/useRequireAuth.js)
- [store/store.js](../../store/store.js)

## 11. Frontend developer checklist

When working on a frontend feature, verify:

- the page is placed in the correct route group,
- route helpers are used instead of hard-coded strings,
- the UI uses shared components where possible,
- loading, empty, and error states are handled,
- API calls use the shared client and response conventions,
- protected pages are guarded correctly.
