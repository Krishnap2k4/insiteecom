'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import ShopTheLookForm from '@/components/Application/Admin/ShopTheLookForm'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_SHOP_THE_LOOK_SHOW } from '@/routes/AdminPanelRoute'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SHOP_THE_LOOK_SHOW, label: 'Shop the Look' },
    { href: '', label: 'Add Video' },
]

const AddShopTheLookPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (payload) => {
        setLoading(true)
        try {
            const { data } = await axios.post('/api/admin/shop-the-look', payload)
            if (!data?.success) throw new Error(data?.message || 'Could not create item.')
            showToast('success', 'Video item created.')
            router.push(ADMIN_SHOP_THE_LOOK_SHOW)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <h2 className='text-xl font-semibold mb-5'>Add Video</h2>
            <ShopTheLookForm onSubmit={handleSubmit} loading={loading} submitLabel='Add Video' />
        </div>
    )
}

export default AddShopTheLookPage
