'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import CategoryForm from '@/components/Application/Admin/CategoryForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_CATEGORY_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CATEGORY_SHOW, label: 'Category' },
    { href: '', label: 'Add Category' },
]

const AddCategoryPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const onSubmit = async (values) => {
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/category/create', values)
            if (!res?.success) throw new Error(res?.message || 'Could not create category.')
            showToast('success', res.message)
            router.push(ADMIN_CATEGORY_SHOW)
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
                    <h4 className='text-xl font-semibold'>Add Category</h4>
                </CardHeader>
                <CardContent className="pb-5">
                    <CategoryForm onSubmit={onSubmit} loading={loading} submitLabel='Add category' />
                </CardContent>
            </Card>
        </div>
    )
}

export default AddCategoryPage
