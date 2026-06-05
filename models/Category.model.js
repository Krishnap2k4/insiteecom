import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * Categories form a tree. Each document carries enough denormalized
 * data to support hierarchy queries with no recursive lookups:
 *
 *   - `parent` is the direct parent (or null for top-level).
 *   - `ancestors[]` is the full chain from root → self.parent, useful
 *     for breadcrumbs and `find({ ancestors: <id> })` to list every
 *     descendant in one query.
 *   - `path` is the slash-joined slug path ("men/shirts/casual"),
 *     used as the canonical storefront URL segment after `/c/`.
 *   - `depth` is the level from root (root = 0).
 *
 * `lib/catalog.js` recomputes these fields on save and propagates
 * changes to descendants when a parent is moved or renamed.
 */
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // No longer globally unique — siblings can share a name as long
        // as their slugs / paths differ. Uniqueness is enforced on
        // (parent, slug) by an application-level check.
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true,
    },
    ancestors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    }],
    path: {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
    },
    depth: {
        type: Number,
        default: 0,
        index: true,
    },
    image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
    },
    description: {
        type: String,
        trim: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    seo: {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        canonical: { type: String, trim: true },
        _id: false,
    },

    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })

// Uniqueness on (parent, slug) — a category's slug must be unique
// among its siblings. Combined with `path` uniqueness this prevents
// duplicate URLs.
categorySchema.index({ parent: 1, slug: 1 }, {
    unique: true,
    partialFilterExpression: { deletedAt: null },
})
categorySchema.index({ path: 1 }, {
    unique: true,
    sparse: true,
    partialFilterExpression: { deletedAt: null },
})

categorySchema.plugin(softDeletePlugin)

const CategoryModel = mongoose.models.Category || mongoose.model('Category', categorySchema, 'categories')
export default CategoryModel
