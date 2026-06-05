import mongoose from "mongoose";
import { softDeletePlugin } from "@/lib/softDeletePlugin";

/**
 * Stored shipping/billing address book entry for a user.
 *
 * Orders take an immutable snapshot of the chosen address at checkout
 * (see Order.billingAddress / Order.shippingAddress in Module 3) so
 * later edits here never alter historical orders.
 */
const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    label: {
        type: String,
        trim: true,
        default: 'Home',
    },
    fullName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        required: true,
    },
    line1: {
        type: String,
        trim: true,
        required: true,
    },
    line2: {
        type: String,
        trim: true,
    },
    landmark: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
        required: true,
    },
    state: {
        type: String,
        trim: true,
        required: true,
    },
    country: {
        type: String,
        trim: true,
        required: true,
    },
    pincode: {
        type: String,
        trim: true,
        required: true,
    },
    type: {
        type: String,
        enum: ['billing', 'shipping', 'both'],
        default: 'both',
    },
    isDefault: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, { timestamps: true })

addressSchema.index({ user: 1, isDefault: 1 })
addressSchema.plugin(softDeletePlugin)

const AddressModel = mongoose.models.Address || mongoose.model('Address', addressSchema, 'addresses')
export default AddressModel
