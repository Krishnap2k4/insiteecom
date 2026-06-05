'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import CouponForm from '@/components/Application/Admin/CouponForm'
import { ADMIN_COUPON_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_COUPON_SHOW, label: 'Coupons' },
    { href: '', label: 'Add Coupon' },
]

const AddCoupon = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const onSubmit = async (payload) => {
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/coupon/create', payload)
            if (!res?.success) throw new Error(res?.message || 'Could not create coupon.')
            showToast('success', res.message)
            router.push(ADMIN_COUPON_SHOW)
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
                <CouponForm submitLabel='Add coupon' onSubmit={onSubmit} loading={loading} />
            </div>
        </div>
    )
}

export default AddCoupon
