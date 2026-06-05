'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_MAINTENANCE_SHOW } from '@/routes/AdminPanelRoute'
import { useState } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiPlayCircle, FiRefreshCw } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_MAINTENANCE_SHOW, label: 'Maintenance' },
]

const TASKS = [
    {
        key: 'seed-rbac',
        title: 'Seed RBAC & customer groups',
        description: 'Populates the Permission catalog, default Roles (customer, admin, support, editor, warehouse_manager), the retail CustomerGroup, and back-fills the admin role on every legacy admin user. Idempotent — safe to re-run.',
        endpoint: '/api/maintenance/seed-rbac',
        runWhen: 'Run once after deploying Module 1.',
    },
    {
        key: 'migrate-catalog',
        title: 'Migrate catalog (Module 2)',
        description: 'Backfills publicId on every product, computes category hierarchy (parent / ancestors / path), creates the default `generic` brand if missing, derives product.options[] from existing variants, mirrors variant.color/size into variant.optionValues[], moves legacy product.attributes into product.specifications, cleans up any legacy auto-managed default variants (real variants survive; products with only a default variant keep theirs as a normal variant), and seeds Inventory rows for every variant. Idempotent.',
        endpoint: '/api/maintenance/migrate-catalog',
        runWhen: 'Run after Module 2 deploy to migrate existing products to the new catalog shape.',
    },
    {
        key: 'migrate-orders',
        title: 'Migrate orders (Module 3)',
        description: 'Assigns a human-friendly orderNumber to every order, converts legacy flat address fields into a shippingAddress snapshot, maps the old products[] into the new items[] with variant snapshots, derives paymentStatus + fulfillmentStatus from the legacy status, seeds a Payment row for every order with a Razorpay payment id, and writes initial OrderStatusHistory entries so the timeline view is populated for old orders. Idempotent.',
        endpoint: '/api/maintenance/migrate-orders',
        runWhen: 'Run after Module 3 deploy to migrate existing orders to the new shape.',
    },
    {
        key: 'migrate-coupons',
        title: 'Migrate coupons (Module 4)',
        description: 'Mirrors legacy coupon fields (discountPercentage, minShoppingAmount, validity) into the new (discountType, discountValue, minOrderValue, endsAt, status) shape. Auto-flips already-expired coupons to status=expired so the admin list reflects reality. Idempotent.',
        endpoint: '/api/maintenance/migrate-coupons',
        runWhen: 'Run after Module 4 deploy to upgrade existing coupons to the new shape.',
    },
]

/**
 * Admin Maintenance — one click per migration / seeder so admins
 * don't need to curl with their cookie. Each task posts to its
 * idempotent endpoint and renders the summary the server returns.
 */
const MaintenancePage = () => {
    const [runState, setRunState] = useState({})

    const run = async (task) => {
        setRunState((prev) => ({
            ...prev,
            [task.key]: { ...prev[task.key], loading: true, error: null },
        }))
        try {
            const { data: res } = await axios.post(task.endpoint)
            if (!res?.success) throw new Error(res?.message || 'Run failed.')
            setRunState((prev) => ({
                ...prev,
                [task.key]: {
                    loading: false,
                    error: null,
                    result: res,
                    completedAt: new Date(),
                },
            }))
            showToast('success', res.message || 'Done.')
        } catch (err) {
            setRunState((prev) => ({
                ...prev,
                [task.key]: { loading: false, error: err.message, result: null },
            }))
            showToast('error', err.message)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <Card className='py-0 rounded shadow-sm mb-5'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <h4 className='text-xl font-semibold'>Maintenance</h4>
                    <p className='text-sm text-gray-500 mt-1'>
                        One-shot migrations and seeders. All are idempotent — running them twice is harmless. Use these after deploying a new module to back-fill existing data.
                    </p>
                </CardHeader>
                <CardContent className='py-5'>
                    <div className='rounded-md bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm text-amber-900'>
                        <FiAlertTriangle className='shrink-0 mt-0.5' />
                        <p>
                            These touch many rows. Run during low-traffic periods on production. Check the summary panel below each run for any failures.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className='space-y-4'>
                {TASKS.map((task) => {
                    const state = runState[task.key] || {}
                    return (
                        <Card key={task.key} className='py-0 rounded shadow-sm'>
                            <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                                <div className='flex items-start justify-between gap-3 flex-wrap'>
                                    <div className='min-w-0'>
                                        <h5 className='font-semibold'>{task.title}</h5>
                                        <p className='text-xs text-gray-500 mt-1'>{task.runWhen}</p>
                                    </div>
                                    <Button
                                        type='button'
                                        onClick={() => run(task)}
                                        disabled={state.loading}
                                        className='cursor-pointer shrink-0'
                                    >
                                        {state.loading ? (
                                            <>
                                                <FiRefreshCw size={14} className='mr-1 animate-spin' /> Running…
                                            </>
                                        ) : state.result ? (
                                            <>
                                                <FiRefreshCw size={14} className='mr-1' /> Run again
                                            </>
                                        ) : (
                                            <>
                                                <FiPlayCircle size={14} className='mr-1' /> Run
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className='py-4'>
                                <p className='text-sm text-gray-700 mb-4'>{task.description}</p>

                                {state.error && (
                                    <div className='rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-900 flex items-start gap-2'>
                                        <FiAlertTriangle className='shrink-0 mt-0.5' />
                                        <div>
                                            <p className='font-medium'>Run failed</p>
                                            <p className='text-xs mt-1 font-mono'>{state.error}</p>
                                        </div>
                                    </div>
                                )}

                                {state.result && (
                                    <div className='rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-900'>
                                        <div className='flex items-start gap-2 mb-2'>
                                            <FiCheckCircle className='shrink-0 mt-0.5' />
                                            <div className='flex-1'>
                                                <p className='font-medium'>{state.result.message || 'Done.'}</p>
                                                {state.completedAt && (
                                                    <p className='text-xs text-green-700 mt-0.5'>
                                                        Completed {state.completedAt.toLocaleTimeString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {state.result.data && (
                                            <details className='mt-3'>
                                                <summary className='cursor-pointer text-xs text-green-800 hover:underline select-none'>
                                                    View detailed summary
                                                </summary>
                                                <pre className='mt-2 p-3 bg-white border border-green-200 rounded text-xs overflow-x-auto text-gray-700'>
{JSON.stringify(state.result.data, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

export default MaintenancePage
