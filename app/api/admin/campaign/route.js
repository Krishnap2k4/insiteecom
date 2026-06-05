import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { recordAudit } from '@/lib/audit'
import CampaignModel from '@/models/Campaign.model'
import CouponModel from '@/models/Coupon.model'
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const bodySchema = z.object({
    name: z.string().trim().min(2),
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
    description: z.string().trim().optional().default(''),
    type: z.enum(['promo', 'email', 'banner', 'mixed']).default('promo'),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']).default('draft'),
    targeting: z.object({
        allCustomers: z.boolean().default(true),
        customerGroups: z.array(objectId).default([]),
        firstOrderOnly: z.boolean().default(false),
    }).default({ allCustomers: true, customerGroups: [], firstOrderOnly: false }),
    coupons: z.array(objectId).default([]),
})

const syncCouponLinks = async (campaignId, couponIds) => {
    if (!Array.isArray(couponIds)) return
    // Detach coupons that were on this campaign but no longer are.
    await CouponModel.updateMany(
        { campaign: campaignId, _id: { $nin: couponIds }, deletedAt: null },
        { $set: { campaign: null } }
    )
    // Attach the new set.
    if (couponIds.length > 0) {
        await CouponModel.updateMany(
            { _id: { $in: couponIds }, deletedAt: null },
            { $set: { campaign: campaignId } }
        )
    }
}

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const searchParams = request.nextUrl.searchParams
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 10, 10)
        const globalFilter = searchParams.get('globalFilter') || ''
        const sorting = JSON.parse(searchParams.get('sorting') || '[]')
        const deleteType = searchParams.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') matchQuery = { deletedAt: null }
        else if (deleteType === 'PD') matchQuery = { deletedAt: { $ne: null } }

        if (globalFilter) {
            matchQuery.$or = [
                { name: { $regex: globalFilter, $options: 'i' } },
                { slug: { $regex: globalFilter, $options: 'i' } },
                { status: { $regex: globalFilter, $options: 'i' } },
                { type: { $regex: globalFilter, $options: 'i' } },
            ]
        }
        const sortQuery = {}
        sorting.forEach((s) => { sortQuery[s.id] = s.desc ? -1 : 1 })

        const pipeline = [
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    name: 1, slug: 1, type: 1, status: 1,
                    startsAt: 1, endsAt: 1,
                    couponCount: { $size: { $ifNull: ['$coupons', []] } },
                    createdAt: 1, deletedAt: 1,
                },
            },
        ]
        const data = await CampaignModel.aggregate(pipeline)
        const totalRowCount = await CampaignModel.countDocuments(matchQuery)
        return NextResponse.json({ success: true, data, meta: { totalRowCount } })
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: parsed.error.issues })
        }
        const data = parsed.data

        const doc = await CampaignModel.create({ ...data, createdBy: auth.userId })
        await syncCouponLinks(doc._id, data.coupons)

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'campaign.create', entity: 'Campaign', entityId: doc._id,
            meta: { name: doc.name },
        })

        return response(true, 200, 'Campaign created.', { _id: String(doc._id) })
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const parsed = bodySchema.extend({ _id: objectId }).safeParse(payload)
        if (!parsed.success) {
            return response(false, 400, 'Invalid or missing fields.', { issues: parsed.error.issues })
        }
        const data = parsed.data
        const doc = await CampaignModel.findOne({ _id: data._id, deletedAt: null })
        if (!doc) return response(false, 404, 'Campaign not found.')

        Object.assign(doc, {
            name: data.name, slug: data.slug, description: data.description,
            type: data.type, startsAt: data.startsAt, endsAt: data.endsAt,
            status: data.status, targeting: data.targeting, coupons: data.coupons,
        })
        await doc.save()
        await syncCouponLinks(doc._id, data.coupons)

        recordAudit({
            actor: auth.userId, actorRole: 'admin',
            action: 'campaign.update', entity: 'Campaign', entityId: doc._id,
        })
        return response(true, 200, 'Campaign updated.')
    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const ids = payload?.ids || []
        const deleteType = payload?.deleteType
        if (!Array.isArray(ids) || ids.length === 0) return response(false, 400, 'No campaigns selected.')

        if (deleteType === 'SD') {
            await CampaignModel.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date() } })
            return response(true, 200, 'Moved to trash.')
        }
        if (deleteType === 'RSD') {
            await CampaignModel.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: null } })
            return response(true, 200, 'Restored.')
        }
        if (deleteType === 'PD') {
            await CampaignModel.deleteMany({ _id: { $in: ids } })
            return response(true, 200, 'Permanently deleted.')
        }
        return response(false, 400, 'Invalid delete type.')
    } catch (error) {
        return catchError(error)
    }
}
