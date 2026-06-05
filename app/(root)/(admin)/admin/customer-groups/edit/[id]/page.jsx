'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import CustomerGroupForm from '@/components/Application/Admin/CustomerGroupForm'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_CUSTOMER_GROUPS_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Chip } from '@mui/material'
import { use, useEffect, useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CUSTOMER_GROUPS_SHOW, label: 'Customer Groups' },
    { href: '', label: 'Edit Group' },
]

const EditCustomerGroupPage = ({ params }) => {
    const { id } = use(params)
    const [group, setGroup] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const { data: res } = await axios.get(`/api/admin/customer-groups/${id}`)
                if (res?.success) setGroup(res.data)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const onSubmit = async (values) => {
        setSaving(true)
        try {
            // `code` is locked on edit — strip it from the payload.
            const { code, ...rest } = values
            const { data: res } = await axios.put(`/api/admin/customer-groups/${id}`, rest)
            if (!res?.success) throw new Error(res?.message || 'Could not save.')
            showToast('success', res.message)
            setGroup(res.data)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className="py-0 rounded shadow-sm">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <div className='flex items-center justify-between gap-3'>
                        <h4 className='text-xl font-semibold'>
                            Edit Customer Group
                            {group && <span className='text-gray-400 font-mono text-sm ml-2'>({group.code})</span>}
                        </h4>
                        {group?.isSystem && <Chip size='small' label='System' color='primary' variant='outlined' />}
                    </div>
                </CardHeader>
                <CardContent className="pb-5">
                    {loading && <div className='py-10 text-center text-gray-400'>Loading…</div>}
                    {!loading && group && (
                        <CustomerGroupForm
                            initialValues={group}
                            onSubmit={onSubmit}
                            loading={saving}
                            submitLabel='Save changes'
                            mode='edit'
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default EditCustomerGroupPage
