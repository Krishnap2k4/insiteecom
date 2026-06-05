'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import CampaignForm from '@/components/Application/Admin/CampaignForm'
import { ADMIN_CAMPAIGN_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CAMPAIGN_SHOW, label: 'Campaigns' },
    { href: '', label: 'New campaign' },
]

const AddCampaign = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const onSubmit = async (payload) => {
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/admin/campaign', payload)
            if (!res?.success) throw new Error(res?.message || 'Could not create campaign.')
            showToast('success', res.message)
            router.push(ADMIN_CAMPAIGN_SHOW)
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
                <CampaignForm submitLabel='Create campaign' onSubmit={onSubmit} loading={loading} />
            </div>
        </div>
    )
}

export default AddCampaign
