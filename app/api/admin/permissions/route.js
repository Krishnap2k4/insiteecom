import { isAuthenticated } from '@/lib/authentication'
import { catchError, response } from '@/lib/helperFunction'
import { PERMISSIONS, PERMISSION_CATEGORIES } from '@/lib/permissionCatalog'

/**
 * Read-only listing of the permission catalog. The admin Role editor
 * uses this to render a grouped multi-select. Source of truth is the
 * in-code catalog (`lib/permissionCatalog.js`), mirrored into the
 * Permission collection by the seed-rbac route.
 */
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        // Group permissions by category for easy rendering in the UI.
        const grouped = {}
        for (const p of PERMISSIONS) {
            if (!grouped[p.category]) grouped[p.category] = []
            grouped[p.category].push(p)
        }

        return response(true, 200, 'Permissions fetched.', {
            categories: Object.values(PERMISSION_CATEGORIES),
            grouped,
            flat: PERMISSIONS,
        })
    } catch (error) {
        return catchError(error)
    }
}
