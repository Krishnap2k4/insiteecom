import { catchError, response } from "@/lib/helperFunction"
import { getProductDetails } from "@/lib/data/productDetails"

/**
 * Product detail endpoint — thin wrapper around `lib/data/productDetails`.
 * The heavy lifting lives in the shared helper so server components can
 * call the same logic directly (no HTTP loopback).
 */
export async function GET(request, { params }) {
    try {
        const { slug: rawSlug } = await params

        // Flatten searchParams into a plain object for the helper.
        const queryParams = {}
        for (const [k, v] of request.nextUrl.searchParams.entries()) {
            queryParams[k] = v
        }

        const result = await getProductDetails(rawSlug, queryParams)
        if (!result.ok) {
            return response(false, result.status || 404, result.message || 'Product not found.')
        }
        return response(true, 200, 'Product data found.', result.data)
    } catch (error) {
        return catchError(error)
    }
}
