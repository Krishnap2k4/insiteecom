'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import BrandForm from '@/components/Application/Admin/BrandForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_BRAND_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_BRAND_SHOW, label: 'Brand' },
    { href: '', label: 'Add Brand' },
]

const AddBrandPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const onSubmit = async (values) => {
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/brand/create', values)
            if (!res?.success) throw new Error(res?.message || 'Could not create brand.')
            showToast('success', res.message)
            router.push(ADMIN_BRAND_SHOW)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className="py-0 rounded shadow-sm">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <h4 className='text-xl font-semibold'>Add Brand</h4>
                </CardHeader>
                <CardContent className="pb-5">
                    <BrandForm onSubmit={onSubmit} loading={loading} submitLabel='Add brand' />
                </CardContent>
            </Card>
        </div>
    )
}

export default AddBrandPage
