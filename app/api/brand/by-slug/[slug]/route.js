import { catchError, response } from '@/lib/helperFunction'
import { getBrandBySlug } from '@/lib/data/brandBySlug'

/**
 * Public storefront endpoint — thin wrapper around `lib/data/brandBySlug`.
 * The data layer is also called directly by `/b/[slug]/page.jsx`.
 */
export async function GET(_request, { params }) {
    try {
        const { slug } = await params
        const result = await getBrandBySlug(slug)
        if (!result.ok) {
            return response(false, result.status || 404, result.message || 'Brand not found.')
        }
        return response(true, 200, 'Brand fetched.', result.data)
    } catch (error) {
        return catchError(error)
    }
}
