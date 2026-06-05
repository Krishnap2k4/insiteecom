'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import CouponForm from '@/components/Application/Admin/CouponForm'
import { ADMIN_COUPON_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'
import { use, useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_COUPON_SHOW, label: 'Coupons' },
    { href: '', label: 'Edit Coupon' },
]

const EditCoupon = ({ params }) => {
    const { id } = use(params)
    const [loading, setLoading] = useState(false)
    const { data: getCouponData, loading: fetchLoading } = useFetch(`/api/coupon/get/${id}`)
    const coupon = getCouponData?.success ? getCouponData.data : null

    const onSubmit = async (payload) => {
        setLoading(true)
        try {
            const { data: res } = await axios.put('/api/coupon/update', { _id: id, ...payload })
            if (!res?.success) throw new Error(res?.message || 'Could not update coupon.')
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <div className='max-w-4xl'>
                {fetchLoading ? (
                    <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
                ) : !coupon ? (
                    <div className='border rounded p-10 text-center text-red-500 font-semibold'>Coupon not found.</div>
                ) : (
                    <CouponForm initial={coupon} submitLabel='Save changes' onSubmit={onSubmit} loading={loading} />
                )}
            </div>
        </div>
    )
}

export default EditCoupon
