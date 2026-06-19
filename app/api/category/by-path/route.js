import { catchError, response } from '@/lib/helperFunction'
import { getCategoryByPath } from '@/lib/data/categoryByPath'

/**
 * Public storefront endpoint — thin wrapper around
 * `lib/data/categoryByPath`. The data layer is also called directly by
 * `/c/[...slug]/page.jsx`.
 *
 *   GET /api/category/by-path?path=men/shirts
 *   GET /api/category/by-path?path=men/shirts&page=2&size=20
 */
export async function GET(request) {
    try {
        const sp   = request.nextUrl.searchParams
        const path = sp.get('path') || ''
        const page = sp.get('page')
        const size = sp.get('size')

        const result = await getCategoryByPath(path, { page, size })
        if (!result.ok) {
            return response(false, result.status || 404, result.message || 'Category not found.')
        }
        return response(true, 200, 'Category fetched.', result.data)
    } catch (error) {
        return catchError(error)
    }
}
