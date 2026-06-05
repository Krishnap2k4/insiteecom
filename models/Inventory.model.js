import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * Per-variant stock state. Split out from ProductVariant so that
 * checkout can perform atomic reservation via `$inc` on `reserved`
 * without touching the variant document, and so we can later track
 * stock per warehouse.
 *
 * `available` is computed as `quantity - reserved` at read time —
 * a virtual on the schema. The unique index on (variant, warehouse)
 * means each variant has exactly one row per warehouse.
 *
 * Module 2.5 ships the admin UI for adjusting stock; this module
 * lands the model + the migration that seeds one row per variant.
 */
const inventorySchema = new mongoose.Schema({
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true,
        index: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    // 'default' is the implicit single warehouse until multi-location
    // support lands. Treat it as a string code so the eventual move to
    // a Warehouse collection is non-breaking.
    warehouse: {
        type: String,
        default: 'default',
        trim: true,
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    reserved: {
        type: Number,
        default: 0,
        min: 0,
    },
    reorderLevel: {
        type: Number,
        default: 0,
        min: 0,
    },
    backorderable: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, { timestamps: true })

inventorySchema.virtual('available').get(function () {
    return Math.max(0, (this.quantity || 0) - (this.reserved || 0))
})

inventorySchema.index({ variant: 1, warehouse: 1 }, {
    unique: true,
    partialFilterExpression: { deletedAt: null },
})

inventorySchema.plugin(softDeletePlugin)

const InventoryModel = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema, 'inventories')
export default InventoryModel
