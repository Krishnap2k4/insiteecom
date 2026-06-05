import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * A named bundle of permissions assignable to users.
 *
 * Built-in roles (`customer`, `admin`, `support`, `editor`,
 * `warehouse_manager`) are seeded with `isSystem: true` and protected
 * from deletion. Admins can edit their permissions array and create
 * new roles.
 *
 * NOTE: this module ships the model and the seed maintenance route.
 * Existing auth still gates by the legacy `User.role` string
 * (`'user'` or `'admin'`) for backwards compatibility. Modules 2-8
 * will migrate routes to permission checks one at a time using
 * `hasPermission()` from `lib/permissions.js`.
 */
const roleSchema = new mongoose.Schema({
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
    permissions: [{
        type: String,
        trim: true,
    }],
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

roleSchema.plugin(softDeletePlugin)

const RoleModel =
    mongoose.models.Role || mongoose.model('Role', roleSchema, 'roles')

export default RoleModel
