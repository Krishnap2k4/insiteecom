import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import BrandModel from '@/models/Brand.model'

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()
        const ids = payload.ids || []
        const deleteType = payload.deleteType

        if (!Array.isArray(ids) || ids.length === 0) {
            return response(false, 400, 'Invalid or empty id list.')
        }

        if (!['SD', 'RSD'].includes(deleteType)) {
            return response(false, 400, 'Delete type should be SD or RSD for this route.')
        }

        if (deleteType === 'SD') {
            // System brands cannot be deleted.
            const blockedSystem = await BrandModel.countDocuments({ _id: { $in: ids }, isSystem: true })
            if (blockedSystem > 0) {
                return response(false, 400, 'System brands cannot be deleted.')
            }
            await BrandModel.updateMany(
                { _id: { $in: ids } },
                { $set: { deletedAt: new Date().toISOString() } }
            )
            return response(true, 200, 'Data moved into trash.')
        }

        await BrandModel.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: null } })
        return response(true, 200, 'Data restored.')
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
        const ids = payload.ids || []
        const deleteType = payload.deleteType

        if (!Array.isArray(ids) || ids.length === 0) {
            return response(false, 400, 'Invalid or empty id list.')
        }
        if (deleteType !== 'PD') {
            return response(false, 400, 'Delete type should be PD for this route.')
        }

        const blockedSystem = await BrandModel.countDocuments({ _id: { $in: ids }, isSystem: true })
        if (blockedSystem > 0) {
            return response(false, 400, 'System brands cannot be deleted.')
        }

        await BrandModel.deleteMany({ _id: { $in: ids } })
        return response(true, 200, 'Data deleted permanently.')
    } catch (error) {
        return catchError(error)
    }
}
