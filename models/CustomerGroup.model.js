import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * Tier for grouping customers (retail / wholesale / vip / ...).
 *
 * Used by the Marketing module for price rules and coupon eligibility,
 * and by the Users module on User.customerGroup.
 *
 * `isSystem: true` flags built-in groups (e.g. 'retail') that must
 * always exist — the admin UI prevents deleting them.
 */
const customerGroupSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    taxExempt: {
        type: Boolean,
        default: false,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isSystem: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, { timestamps: true })

customerGroupSchema.plugin(softDeletePlugin)

const CustomerGroupModel =
    mongoose.models.CustomerGroup ||
    mongoose.model('CustomerGroup', customerGroupSchema, 'customergroups')

export default CustomerGroupModel
