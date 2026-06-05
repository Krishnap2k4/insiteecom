import axios from 'axios'

/**
 * Shared axios instance used by every browser/server caller in this app.
 *
 * Two reasons it exists:
 *
 *  1) `validateStatus: () => true` — axios will not throw on 4xx/5xx.
 *     The codebase reads the `{ success, statusCode, message, data }`
 *     body to decide what to do. With proper HTTP statuses now coming
 *     from `lib/helperFunction.js`, callers would otherwise need
 *     try/catch around every request. Treating non-2xx as a resolved
 *     response keeps the existing read-then-branch pattern working.
 *
 *  2) Single place to add interceptors later (auth headers, request id
 *     propagation, retry, telemetry) without touching every call site.
 *
 * Usage: `import axios from '@/lib/apiClient'` — identical surface to
 * the bare axios import it replaces. The exported instance has the
 * standard `.get / .post / .put / .delete / .patch / .request` methods.
 */
const apiClient = axios.create({
    validateStatus: () => true,
})

export default apiClient
