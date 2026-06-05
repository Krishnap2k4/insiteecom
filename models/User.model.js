import mongoose, { mongo } from "mongoose";
import bcrypt from 'bcryptjs'
import { softDeletePlugin } from "@/lib/softDeletePlugin";
const userSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin'],
        default: 'user'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        select: false
    },
    avatar: {
        url: {
            type: String,
            trim: true
        },
        public_id: {
            type: String,
            trim: true
        },
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        trim: true,
    },
    // Legacy free-text address from the original schema. New code reads
    // from the Address collection; this stays for backwards compatibility
    // with existing data and the original /profile form.
    address: {
        type: String,
        trim: true,
    },
    phoneVerified: {
        type: Boolean,
        default: false,
    },
    lastLoginAt: {
        type: Date,
    },
    // OAuth / social login linkages — empty by default until those
    // providers are wired in a later module.
    loginProviders: [{
        provider: {
            type: String,
            enum: ['email', 'google', 'facebook', 'apple'],
            required: true,
        },
        providerId: { type: String, trim: true },
        linkedAt: { type: Date, default: Date.now },
        _id: false,
    }],
    // Tier reference for marketing/pricing rules. Defaults to the seeded
    // `retail` group when a user registers (assigned by the API, not the
    // schema, so we don't force a populate on every read).
    customerGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerGroup',
    },
    defaultAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    },
    // RBAC additive. The legacy `role` string above remains the
    // authoritative auth gate today; routes opt-in to permission checks
    // by reading from `roles[].permissions` via `lib/permissions.js`.
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
    }],
    deletedAt: {
        type: Date,
        default: null,
        index: true
    },
}, { timestamps: true })


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();
})


userSchema.methods = {
    comparePassword: async function (password) {
        return await bcrypt.compare(password, this.password)
    }
}

userSchema.plugin(softDeletePlugin)

const UserModel = mongoose.models.User || mongoose.model('User', userSchema, 'users')
export default UserModel