import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import CategoryModel from '@/models/Category.model'

/**
 * Nested tree of every active category. Used by:
 *   - admin category parent-picker
 *   - storefront mega-menu / sidebar
 *   - CMS menu builder (Module 4)
 *
 * The returned shape is an array of root nodes, each with a nested
 * `children` array. Computed in one query — we fetch every category
 * (flat) and assemble the tree in JS.
 */
export async function GET() {
    try {
        await connectDB()

        const flat = await CategoryModel
            .find({ deletedAt: null })
            .sort({ depth: 1, sortOrder: 1, name: 1 })
            .select('_id name slug parent path depth sortOrder isActive image')
            .lean()

        const byId = new Map()
        for (const cat of flat) {
            byId.set(String(cat._id), { ...cat, children: [] })
        }

        const roots = []
        for (const cat of flat) {
            const node = byId.get(String(cat._id))
            if (cat.parent) {
                const parent = byId.get(String(cat.parent))
                if (parent) parent.children.push(node)
                else roots.push(node)
            } else {
                roots.push(node)
            }
        }

        return response(true, 200, 'Category tree fetched.', roots)
    } catch (error) {
        return catchError(error)
    }
}
