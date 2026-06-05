
import { NextResponse } from "next/server"

/**
 * Standard API JSON response.
 *
 * Body shape `{ success, statusCode, message, data }` is preserved for
 * backwards compatibility. The HTTP status of the actual Response is
 * now set to `statusCode` so browsers, CDNs, and tooling see the
 * correct semantic status instead of the previous always-200.
 *
 * Frontend callers use `lib/apiClient.js` which is configured with
 * `validateStatus: () => true`, so non-2xx responses do not throw —
 * callers continue to branch on the body's `success` field.
 */
export const response = (success, statusCode, message, data = {}) => {
    return NextResponse.json(
        { success, statusCode, message, data },
        { status: statusCode }
    )
}

/**
 * Centralized error → response mapper. Used inside `catch` blocks of
 * route handlers. Maps common error shapes to a sensible HTTP status:
 *
 *   - Mongoose duplicate key (E11000) → 409 Conflict
 *   - Zod validation error            → 400 Bad Request
 *   - Anything else                   → 500 Internal Server Error
 *
 * In development, the original `error.message` is surfaced so issues
 * are debuggable. In production, a generic message is returned unless
 * the caller passes a custom one.
 */
export const catchError = (error, customMessage) => {
    let statusCode = 500
    let message = customMessage || 'Internal server error.'
    let data = {}

    if (error?.code === 11000) {
        statusCode = 409
        const keys = Object.keys(error.keyPattern || {}).join(',')
        message = `Duplicate fields: ${keys}. These fields value must be unique.`
    } else if (error?.name === 'ZodError') {
        statusCode = 400
        message = 'Invalid or missing fields.'
        data = { issues: error.issues }
    } else if (process.env.NODE_ENV === 'development' && error?.message) {
        message = error.message
        data = { error: { name: error.name, message: error.message } }
    }

    return NextResponse.json(
        { success: false, statusCode, message, data },
        { status: statusCode }
    )
}

export const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    return otp
}


export const columnConfig = (column, isCreatedAt = false, isUpdatedAt = false, isDeletedAt = false) => {
    const newColumn = [...column]

    if (isCreatedAt) {
        newColumn.push({
            accessorKey: 'createdAt',
            header: 'Created At',
            Cell: ({ renderedCellValue }) => (new Date(renderedCellValue).toLocaleString())
        })
    }
    if (isUpdatedAt) {
        newColumn.push({
            accessorKey: 'updatedAt',
            header: 'Updated At',
            Cell: ({ renderedCellValue }) => (new Date(renderedCellValue).toLocaleString())
        })
    }
    if (isDeletedAt) {
        newColumn.push({
            accessorKey: 'deletedAt',
            header: 'Deleted At',
            Cell: ({ renderedCellValue }) => (new Date(renderedCellValue).toLocaleString())
        })
    }

    return newColumn
}

export const statusBadge = (status) => {
    const statusColorConfig = {
        // legacy combined status
        pending: 'bg-blue-500',
        processing: 'bg-yellow-500',
        shipped: 'bg-cyan-500',
        delivered: 'bg-green-500',
        cancelled: 'bg-red-500',
        unverified: 'bg-orange-500',
        // Module 3 split-axis statuses
        paid: 'bg-emerald-500',
        failed: 'bg-red-500',
        refunded: 'bg-gray-500',
        partially_refunded: 'bg-gray-500',
        fulfilled: 'bg-green-500',
        partial: 'bg-sky-500',
        unfulfilled: 'bg-blue-500',
    }
    const label = String(status || '—').replace('_', ' ')
    return <span className={`${statusColorConfig[status] || 'bg-gray-400'} text-white capitalize px-3 py-1 rounded-full text-xs`}>{label}</span>
}
