/**
 * Mongoose plugin: auto-filter soft-deleted documents.
 *
 * Behavior:
 *   - For read-shaped queries (find, findOne, findOneAndUpdate, findOneAndDelete,
 *     count, countDocuments, distinct), injects { deletedAt: null } into the
 *     filter UNLESS:
 *       a) the filter already mentions `deletedAt` (caller is opting out for
 *          trash/restore use cases), OR
 *       b) the query was tagged with .setOptions({ withDeleted: true }).
 *   - Does NOT touch updateMany / updateOne / deleteMany / deleteOne — those
 *     intentionally need to be able to write to soft-deleted records (e.g.
 *     restore-from-trash flows that flip deletedAt back to null).
 *   - Aggregations are not intercepted. Pipelines must add their own
 *     { $match: { deletedAt: null } } stage if needed.
 *
 * Adds convenience helpers:
 *   - doc.softDelete()  — sets deletedAt = now, saves
 *   - doc.restore()      — sets deletedAt = null, saves
 *   - Model.findDeleted(filter) — returns only soft-deleted
 *   - Model.findWithDeleted(filter) — returns both
 *
 * Applied to a schema with:
 *   schema.plugin(softDeletePlugin)
 */

const READ_HOOKS = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'count',
    'countDocuments',
    'estimatedDocumentCount',
    'distinct',
]

const filterMentionsDeletedAt = (filter) => {
    if (!filter || typeof filter !== 'object') return false
    if ('deletedAt' in filter) return true
    if (Array.isArray(filter.$or)) {
        return filter.$or.some(filterMentionsDeletedAt)
    }
    if (Array.isArray(filter.$and)) {
        return filter.$and.some(filterMentionsDeletedAt)
    }
    return false
}

export const softDeletePlugin = (schema) => {
    READ_HOOKS.forEach((hook) => {
        schema.pre(hook, function () {
            const opts = this.getOptions ? this.getOptions() : {}
            if (opts && opts.withDeleted) return

            const filter = this.getFilter ? this.getFilter() : this.getQuery()
            if (filterMentionsDeletedAt(filter)) return

            this.where({ deletedAt: null })
        })
    })

    schema.methods.softDelete = function () {
        this.deletedAt = new Date()
        return this.save()
    }

    schema.methods.restore = function () {
        this.deletedAt = null
        return this.save()
    }

    schema.statics.findDeleted = function (filter = {}) {
        return this.find({ ...filter, deletedAt: { $ne: null } })
    }

    schema.statics.findWithDeleted = function (filter = {}) {
        return this.find(filter).setOptions({ withDeleted: true })
    }
}
