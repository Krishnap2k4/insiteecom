'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import CustomerGroupForm from '@/components/Application/Admin/CustomerGroupForm'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_CUSTOMER_GROUPS_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CUSTOMER_GROUPS_SHOW, label: 'Customer Groups' },
    { href: '', label: 'Add Group' },
]

const AddCustomerGroupPage = () => {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onSubmit = async (values) => {
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/admin/customer-groups', values)
            if (!res?.success) throw new Error(res?.message || 'Could not create.')
            showToast('success', res.message)
            router.push(ADMIN_CUSTOMER_GROUPS_SHOW)
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
                    <h4 className='text-xl font-semibold'>Add Customer Group</h4>
                </CardHeader>
                <CardContent className="pb-5">
                    <CustomerGroupForm
                        onSubmit={onSubmit}
                        loading={loading}
                        submitLabel='Create group'
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default AddCustomerGroupPage
