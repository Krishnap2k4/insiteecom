import mongoose from "mongoose";

/**
 * Catalogue of all permission codes the app knows about.
 *
 * The canonical list lives in `lib/permissionCatalog.js` (so code can
 * reference it without a DB round-trip). The Permission collection is
 * mirror state that `app/api/maintenance/seed-rbac/route.js` keeps in
 * sync — making it possible for the admin UI to render groupings and
 * descriptions without hardcoding them.
 *
 * Permissions are not user-creatable from the UI. They are seeded
 * from code, hence `isSystem: true` by default.
 */
const permissionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
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
    category: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    isSystem: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true })

const PermissionModel =
    mongoose.models.Permission ||
    mongoose.model('Permission', permissionSchema, 'permissions')

export default PermissionModel
