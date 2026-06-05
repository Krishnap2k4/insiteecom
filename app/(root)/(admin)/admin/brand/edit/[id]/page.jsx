'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import BrandForm from '@/components/Application/Admin/BrandForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_BRAND_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Chip } from '@mui/material'
import { use, useEffect, useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_BRAND_SHOW, label: 'Brand' },
    { href: '', label: 'Edit Brand' },
]

const EditBrandPage = ({ params }) => {
    const { id } = use(params)
    const [brand, setBrand] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const { data: res } = await axios.get(`/api/brand/get/${id}`)
                if (res?.success) setBrand(res.data)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const onSubmit = async (values) => {
        setSaving(true)
        try {
            const { data: res } = await axios.put('/api/brand/update', { _id: id, ...values })
            if (!res?.success) throw new Error(res?.message || 'Could not save brand.')
            showToast('success', res.message)
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
                            Edit Brand
                            {brand && <span className='text-gray-400 font-mono text-sm ml-2'>({brand.slug})</span>}
                        </h4>
                        {brand?.isSystem && <Chip size='small' label='System' color='primary' variant='outlined' />}
                    </div>
                </CardHeader>
                <CardContent className="pb-5">
                    {loading && <div className='py-10 text-center text-gray-400'>Loading…</div>}
                    {!loading && brand && (
                        <BrandForm
                            initialValues={brand}
                            onSubmit={onSubmit}
                            loading={saving}
                            submitLabel='Save changes'
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default EditBrandPage
