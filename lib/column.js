import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Chip } from "@mui/material"
import dayjs from "dayjs"
import userIcon from '@/public/assets/images/user.png'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
export const DT_CATEGORY_COLUMN = [
    {
        accessorKey: 'name',
        header: 'Category Name',
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
    },
]

export const DT_BRAND_COLUMN = [
    {
        accessorKey: 'name',
        header: 'Brand Name',
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
    },
    {
        accessorKey: 'productCount',
        header: 'Products',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => (
            <span className='font-medium'>{renderedCellValue ?? 0}</span>
        ),
    },
    {
        accessorKey: 'isActive',
        header: 'Status',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue, row }) => (
            row?.original?.isSystem
                ? <Chip size='small' label='System' color='primary' variant='outlined' />
                : renderedCellValue
                    ? <Chip size='small' color='success' label='Active' />
                    : <Chip size='small' label='Inactive' variant='outlined' />
        ),
    },
]


export const DT_PRODUCT_COLUMN = [
    {
        accessorKey: 'thumbnail',
        header: '',
        size: 70,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ renderedCellValue }) => (
            <div className='w-12 h-12 rounded border overflow-hidden bg-gray-50'>
                <img
                    src={renderedCellValue || imgPlaceholder.src}
                    alt=''
                    className='w-full h-full object-cover'
                />
            </div>
        ),
    },
    {
        accessorKey: 'name',
        header: 'Product Name',
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
    },
    {
        accessorKey: 'category',
        header: 'Category',
    },
    {
        accessorKey: 'mrp',
        header: 'MRP',
    },
    {
        accessorKey: 'sellingPrice',
        header: 'Selling Price',
    },
    {
        accessorKey: 'discountPercentage',
        header: 'Discount Percentage',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => {
            const status = renderedCellValue || 'published'
            if (status === 'published') return <Chip size='small' color='success' label='Published' />
            if (status === 'draft') return <Chip size='small' color='default' label='Draft' variant='outlined' />
            if (status === 'archived') return <Chip size='small' color='warning' label='Archived' variant='outlined' />
            return <Chip size='small' label={status} variant='outlined' />
        },
    },
    {
        accessorKey: 'variantCount',
        header: 'Variants',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => {
            const count = renderedCellValue ?? 0
            if (count === 0) {
                return <Chip size="small" variant="outlined" color="warning" label="None — not purchasable" />
            }
            return <span className="font-medium">{count}</span>
        },
    },
]


export const DT_PRODUCT_VARIANT_COLUMN = [
    {
        accessorKey: 'product',
        header: 'Product Name',
    },
    {
        accessorKey: 'color',
        header: 'Color',
        Cell: ({ renderedCellValue }) => renderedCellValue || <span className="text-gray-400">—</span>,
    },
    {
        accessorKey: 'size',
        header: 'Size',
        Cell: ({ renderedCellValue }) => renderedCellValue || <span className="text-gray-400">—</span>,
    },
    {
        accessorKey: 'sku',
        header: 'SKU',
    },

    {
        accessorKey: 'mrp',
        header: 'MRP',
    },
    {
        accessorKey: 'sellingPrice',
        header: 'Selling Price',
    },
    {
        accessorKey: 'discountPercentage',
        header: 'Discount Percentage',
    },

]


export const DT_COUPON_COLUMN = [
    { accessorKey: 'code', header: 'Code' },
    {
        accessorKey: 'discountType',
        header: 'Type',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => (
            <Chip size='small' label={renderedCellValue || 'percentage'} variant='outlined' className='capitalize' />
        ),
    },
    {
        accessorKey: 'discountValue',
        header: 'Value',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue, row }) => (
            <span>{row.original.discountType === 'fixed' ? `₹${renderedCellValue ?? 0}` : `${renderedCellValue ?? 0}%`}</span>
        ),
    },
    {
        accessorKey: 'minOrderValue',
        header: 'Min. order',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{renderedCellValue ? `₹${renderedCellValue}` : '—'}</span>,
    },
    {
        accessorKey: 'usageCount',
        header: 'Used',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue, row }) => {
            const used = renderedCellValue ?? 0
            const cap = row.original.usageLimit
            return <span>{cap ? `${used} / ${cap}` : `${used}`}</span>
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue, row }) => {
            const ends = row.original.endsAt ? new Date(row.original.endsAt) : null
            const expired = ends && new Date() > ends
            const effective = expired ? 'expired' : (renderedCellValue || 'active')
            const color = effective === 'active' ? 'success'
                : effective === 'paused' ? 'warning'
                    : effective === 'expired' ? 'error'
                        : 'default'
            return <Chip size='small' color={color} label={effective} className='capitalize' />
        },
    },
    {
        accessorKey: 'endsAt',
        header: 'Ends',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => (
            renderedCellValue
                ? <span>{dayjs(renderedCellValue).format('DD MMM YYYY')}</span>
                : <span className='text-gray-400'>—</span>
        ),
    },
]


export const DT_CUSTOMERS_COLUMN = [
    {
        accessorKey: 'avatar',
        header: 'Avatar',
        Cell: ({ renderedCellValue }) => (
            <Avatar>
                <AvatarImage src={renderedCellValue?.url || userIcon.src} />
            </Avatar>
        )
    },
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
    },
    {
        accessorKey: 'address',
        header: 'Address',
    },
    {
        accessorKey: 'isEmailVerified',
        header: 'Is Verified',
        Cell: ({ renderedCellValue }) => (
            renderedCellValue ? <Chip color="success" label="Verified" /> : <Chip color="error" label="Not Verified" />
        )
    },


]

export const DT_REVIEW_COLUMN = [
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'user', header: 'Customer' },
    {
        accessorKey: 'rating',
        header: 'Rating',
        Cell: ({ renderedCellValue }) => (
            <span className='inline-flex items-center gap-0.5'>
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < renderedCellValue ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                ))}
            </span>
        ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const map = { pending: 'warning', approved: 'success', rejected: 'error' }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={renderedCellValue} className='capitalize' />
        },
    },
    {
        accessorKey: 'verifiedBuyer',
        header: 'Verified',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => renderedCellValue
            ? <Chip size='small' color='success' variant='outlined' label='Verified' />
            : <Chip size='small' variant='outlined' label='—' />,
    },
    {
        accessorKey: 'reportedCount',
        header: 'Reports',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => (renderedCellValue || 0) > 0
            ? <Chip size='small' color='error' label={renderedCellValue} />
            : <span className='text-gray-400'>0</span>,
    },
    {
        accessorKey: 'hasReply',
        header: 'Reply',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => renderedCellValue
            ? <Chip size='small' color='info' variant='outlined' label='Replied' />
            : <span className='text-gray-400'>—</span>,
    },
]

const orderStatusChip = (status, kind) => {
    const palette = {
        payment: {
            paid: 'success', pending: 'warning', failed: 'error',
            refunded: 'default', partially_refunded: 'default',
        },
        fulfillment: {
            fulfilled: 'success', partial: 'info',
            unfulfilled: 'warning', cancelled: 'error',
        },
    }
    return <Chip size='small' label={String(status || '—').replace('_', ' ')} color={palette[kind]?.[status] || 'default'} variant='outlined' className='capitalize' />
}

export const DT_ORDER_COLUMN = [
    { accessorKey: 'orderNumber', header: 'Order #' },
    { accessorKey: 'name', header: 'Customer' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone', enableColumnFilter: false },
    { accessorKey: 'itemCount', header: 'Items', enableColumnFilter: false, Cell: ({ renderedCellValue }) => <span>{renderedCellValue ?? 0}</span> },
    {
        accessorKey: 'totalAmount',
        header: 'Total',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue, row }) => (
            <span>{Number(renderedCellValue || 0).toLocaleString('en-IN', { style: 'currency', currency: row?.original?.currency || 'INR' })}</span>
        ),
    },
    { accessorKey: 'paymentStatus', header: 'Payment', enableColumnFilter: false, Cell: ({ renderedCellValue }) => orderStatusChip(renderedCellValue, 'payment') },
    { accessorKey: 'fulfillmentStatus', header: 'Delivery', enableColumnFilter: false, Cell: ({ renderedCellValue }) => orderStatusChip(renderedCellValue, 'fulfillment') },
]

export const DT_REFUND_COLUMN = [
    { accessorKey: 'orderNumber', header: 'Order #' },
    { accessorKey: 'gatewayRefundId', header: 'Gateway ref' },
    {
        accessorKey: 'amount',
        header: 'Amount',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue, row }) => (
            <span>{Number(renderedCellValue || 0).toLocaleString('en-IN', { style: 'currency', currency: row?.original?.currency || 'INR' })}</span>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const map = { pending: 'warning', processed: 'success', failed: 'error' }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={renderedCellValue} className='capitalize' />
        },
    },
    { accessorKey: 'reason', header: 'Reason' },
    {
        accessorKey: 'createdAt',
        header: 'Initiated',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{dayjs(renderedCellValue).format('DD MMM YYYY')}</span>,
    },
]

export const DT_CAMPAIGN_COLUMN = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'slug', header: 'Slug' },
    {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ renderedCellValue }) => <Chip size='small' variant='outlined' label={renderedCellValue} className='capitalize' />,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const color = renderedCellValue === 'active' ? 'success'
                : renderedCellValue === 'paused' ? 'warning'
                    : renderedCellValue === 'completed' ? 'default'
                        : renderedCellValue === 'scheduled' ? 'info' : 'default'
            return <Chip size='small' color={color} label={renderedCellValue} className='capitalize' />
        },
    },
    { accessorKey: 'couponCount', header: 'Coupons', enableColumnFilter: false },
    {
        accessorKey: 'startsAt', header: 'Starts', enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{renderedCellValue ? dayjs(renderedCellValue).format('DD MMM YYYY') : '—'}</span>,
    },
    {
        accessorKey: 'endsAt', header: 'Ends', enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{renderedCellValue ? dayjs(renderedCellValue).format('DD MMM YYYY') : '—'}</span>,
    },
]

export const DT_NEWSLETTER_COLUMN = [
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'source', header: 'Source' },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const color = renderedCellValue === 'subscribed' ? 'success'
                : renderedCellValue === 'unsubscribed' ? 'default'
                    : 'error'
            return <Chip size='small' color={color} label={renderedCellValue} className='capitalize' />
        },
    },
    {
        accessorKey: 'verifiedAt',
        header: 'Verified',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => renderedCellValue
            ? <Chip size='small' color='success' variant='outlined' label='Yes' />
            : <Chip size='small' variant='outlined' label='Pending' />,
    },
    {
        accessorKey: 'createdAt',
        header: 'Subscribed',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{dayjs(renderedCellValue).format('DD MMM YYYY')}</span>,
    },
]

export const DT_SUPPORT_COLUMN = [
    {
        accessorKey: 'subject',
        header: 'Subject',
        Cell: ({ renderedCellValue, row }) => (
            <span className={row?.original?.adminUnread ? 'font-semibold' : ''}>{renderedCellValue || '—'}</span>
        ),
    },
    { accessorKey: 'customerEmail', header: 'Customer' },
    { accessorKey: 'orderNumber', header: 'Order' },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const map = { open: 'success', pending: 'warning', resolved: 'info', closed: 'default' }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={renderedCellValue} className='capitalize' />
        },
    },
    {
        accessorKey: 'priority',
        header: 'Priority',
        Cell: ({ renderedCellValue }) => {
            const map = { urgent: 'error', high: 'warning', normal: 'default', low: 'default' }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={renderedCellValue} className='capitalize' variant={renderedCellValue === 'normal' ? 'outlined' : 'filled'} />
        },
    },
    {
        accessorKey: 'lastMessageAt',
        header: 'Last activity',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{renderedCellValue ? dayjs(renderedCellValue).format('DD MMM YYYY HH:mm') : '—'}</span>,
    },
]

export const DT_CONTACT_COLUMN = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'subject', header: 'Subject' },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const map = { new: 'warning', in_progress: 'info', resolved: 'success', spam: 'default' }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={String(renderedCellValue).replace('_', ' ')} className='capitalize' />
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Received',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{dayjs(renderedCellValue).format('DD MMM YYYY HH:mm')}</span>,
    },
]

export const DT_EMAIL_TEMPLATE_COLUMN = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'locale', header: 'Locale' },
    {
        accessorKey: 'isActive',
        header: 'Active',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => (
            renderedCellValue
                ? <Chip size='small' color='success' label='Active' />
                : <Chip size='small' variant='outlined' label='Fallback to file' />
        ),
    },
    {
        accessorKey: 'updatedAt',
        header: 'Updated',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{dayjs(renderedCellValue).format('DD MMM YYYY HH:mm')}</span>,
    },
]

export const DT_RETURN_COLUMN = [
    { accessorKey: 'returnNumber', header: 'Request #' },
    { accessorKey: 'orderNumber', header: 'Order #' },
    {
        accessorKey: 'type',
        header: 'Type',
        Cell: ({ renderedCellValue }) => (
            <Chip size='small' variant='outlined' label={renderedCellValue} className='capitalize' />
        ),
    },
    { accessorKey: 'itemCount', header: 'Items', enableColumnFilter: false },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const map = {
                requested: 'warning', approved: 'info', received: 'info',
                refunded: 'success', replaced: 'success',
                rejected: 'error', cancelled: 'default',
            }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={renderedCellValue} className='capitalize' />
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Requested',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{dayjs(renderedCellValue).format('DD MMM YYYY')}</span>,
    },
]

export const DT_SHIPMENT_COLUMN = [
    { accessorKey: 'orderNumber', header: 'Order #' },
    { accessorKey: 'carrier', header: 'Carrier' },
    { accessorKey: 'trackingNumber', header: 'Tracking' },
    {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ renderedCellValue }) => {
            const map = {
                pending: 'warning', in_transit: 'info', out_for_delivery: 'info',
                delivered: 'success', returned: 'default', cancelled: 'error',
            }
            return <Chip size='small' color={map[renderedCellValue] || 'default'} label={String(renderedCellValue).replace('_', ' ')} className='capitalize' />
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Created',
        enableColumnFilter: false,
        Cell: ({ renderedCellValue }) => <span>{dayjs(renderedCellValue).format('DD MMM YYYY')}</span>,
    },
]