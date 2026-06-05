import CategoryModel from '@/models/Category.model'
import mongoose from 'mongoose'

/**
 * Helpers for keeping Category tree fields consistent.
 *
 * Each Category document carries denormalized hierarchy data
 * (`ancestors[]`, `path`, `depth`) so storefront / admin reads stay
 * cheap. The trade-off is writes — a rename of a non-leaf category
 * must propagate down. These helpers do that work.
 */

/**
 * Resolve the ancestors / path / depth for a category given its
 * parent ID. Pass parentId = null for a root category.
 *
 *   const { ancestors, path, depth } =
 *     await resolveHierarchy({ slug: 'shirts', parentId: '...' })
 */
export const resolveHierarchy = async ({ slug, parentId }) => {
    if (!parentId) {
        return {
            ancestors: [],
            path: slug,
            depth: 0,
        }
    }
    const parent = await CategoryModel
        .findOne({ _id: parentId, deletedAt: null })
        .select('ancestors path depth')
        .lean()
    if (!parent) {
        throw new Error('Parent category not found.')
    }
    return {
        ancestors: [...(parent.ancestors || []), new mongoose.Types.ObjectId(parentId)],
        path: parent.path ? `${parent.path}/${slug}` : slug,
        depth: (parent.depth || 0) + 1,
    }
}

/**
 * Re-derive hierarchy for every descendant of a category. Call after
 * the parent's `path` or position in the tree changes — keeps child
 * paths in sync so storefront URLs don't drift out of step.
 *
 * Returns the number of documents touched.
 */
export const propagateHierarchy = async (rootId) => {
    const root = await CategoryModel
        .findOne({ _id: rootId, deletedAt: null })
        .select('ancestors path depth')
        .lean()
    if (!root) return 0

    const descendants = await CategoryModel
        .find({ ancestors: rootId, deletedAt: null })
        .select('_id slug parent ancestors path depth')
        .lean()

    // Index by parent for a single-pass traversal in depth order.
    const byParent = new Map()
    for (const cat of descendants) {
        const key = String(cat.parent)
        if (!byParent.has(key)) byParent.set(key, [])
        byParent.get(key).push(cat)
    }

    const ops = []
    const walk = (parentId, parentAncestors, parentPath, parentDepth) => {
        const children = byParent.get(String(parentId)) || []
        for (const child of children) {
            const ancestors = [...parentAncestors, parentId]
            const path = parentPath ? `${parentPath}/${child.slug}` : child.slug
            const depth = parentDepth + 1
            ops.push({
                updateOne: {
                    filter: { _id: child._id },
                    update: { $set: { ancestors, path, depth } },
                },
            })
            walk(child._id, ancestors, path, depth)
        }
    }

    walk(root._id, root.ancestors || [], root.path || '', root.depth || 0)

    if (ops.length === 0) return 0
    const result = await CategoryModel.bulkWrite(ops)
    return result.modifiedCount || 0
}

/**
 * Find a category by its hierarchical path ("men/shirts/casual").
 * Returns null if no match.
 */
export const findCategoryByPath = async (path) => {
    if (!path) return null
    const normalized = String(path).toLowerCase().replace(/^\/+|\/+$/g, '')
    return CategoryModel.findOne({ path: normalized, deletedAt: null }).lean()
}
