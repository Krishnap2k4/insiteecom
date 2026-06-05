'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import CampaignForm from '@/components/Application/Admin/CampaignForm'
import { ADMIN_CAMPAIGN_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'
import { use, useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CAMPAIGN_SHOW, label: 'Campaigns' },
    { href: '', label: 'Edit campaign' },
]

const EditCampaign = ({ params }) => {
    const { id } = use(params)
    const { data: getCampaignData, loading: fetchLoading } = useFetch(`/api/admin/campaign/${id}`)
    const [loading, setLoading] = useState(false)

    const onSubmit = async (payload) => {
        setLoading(true)
        try {
            const { data: res } = await axios.put('/api/admin/campaign', { _id: id, ...payload })
            if (!res?.success) throw new Error(res?.message || 'Could not update campaign.')
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    const initial = getCampaignData?.success ? getCampaignData.data : null

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <div className='max-w-4xl'>
                {fetchLoading ? (
                    <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
                ) : !initial ? (
                    <div className='border rounded p-10 text-center text-red-500 font-semibold'>Campaign not found.</div>
                ) : (
                    <CampaignForm initial={initial} submitLabel='Save changes' onSubmit={onSubmit} loading={loading} />
                )}
            </div>
        </div>
    )
}

export default EditCampaign
