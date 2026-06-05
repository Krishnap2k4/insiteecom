import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { logger } from '@/lib/logger'
import CouponModel from '@/models/Coupon.model'

/**
 * Idempotent migration for Module 4. Mirrors the legacy coupon shape
 * (`discountPercentage`, `minShoppingAmount`, `validity`) into the
 * new fields (`discountType`, `discountValue`, `minOrderValue`,
 * `endsAt`, `status`). Safe to re-run.
 */
export async function POST() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()

        const candidates = await CouponModel
            .find({ deletedAt: null })
            .select('code discountPercentage discountValue discountType minShoppingAmount minOrderValue validity endsAt startsAt createdAt status usageCount')
            .lean()

        let migrated = 0
        let expiredFlipped = 0
        const ops = []
        for (const c of candidates) {
            const update = {}
            if (c.discountValue == null && c.discountPercentage != null) {
                update.discountValue = c.discountPercentage
            }
            if (!c.discountType) update.discountType = 'percentage'
            if (c.minOrderValue == null && c.minShoppingAmount != null) {
                update.minOrderValue = c.minShoppingAmount
            }
            if (!c.endsAt && c.validity) update.endsAt = c.validity
            if (!c.startsAt) update.startsAt = c.createdAt || new Date()
            if (c.usageCount == null) update.usageCount = 0
            if (!c.status) update.status = 'active'

            // Auto-flip expired coupons so they don't show as 'active'
            // in the new column.
            const effectiveEnd = c.endsAt || c.validity
            if (effectiveEnd && new Date(effectiveEnd) < new Date() && (update.status || c.status) !== 'expired') {
                update.status = 'expired'
                expiredFlipped += 1
            }

            if (Object.keys(update).length > 0) {
                ops.push({
                    updateOne: { filter: { _id: c._id }, update: { $set: update } },
                })
                migrated += 1
            }
        }

        if (ops.length > 0) await CouponModel.bulkWrite(ops)

        const summary = { scanned: candidates.length, migrated, expiredFlipped }
        logger.info('migrate-coupons run complete', summary)
        return response(true, 200, 'Coupon migration complete.', summary)
    } catch (error) {
        return catchError(error)
    }
}
