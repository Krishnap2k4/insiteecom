'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import ShopTheLookForm from '@/components/Application/Admin/ShopTheLookForm'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_SHOP_THE_LOOK_SHOW } from '@/routes/AdminPanelRoute'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SHOP_THE_LOOK_SHOW, label: 'Shop the Look' },
    { href: '', label: 'Edit Video' },
]

const EditShopTheLookPage = ({ params }) => {
    const { id } = use(params)
    const router = useRouter()
    const [initial, setInitial] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await axios.get(`/api/admin/shop-the-look/${id}`)
                if (data?.success) setInitial(data.data)
                else showToast('error', 'Item not found.')
            } catch {
                showToast('error', 'Could not load item.')
            }
        }
        load()
    }, [id])

    const handleSubmit = async (payload) => {
        setLoading(true)
        try {
            const { data } = await axios.put(`/api/admin/shop-the-look/${id}`, payload)
            if (!data?.success) throw new Error(data?.message || 'Could not update item.')
            showToast('success', 'Video item updated.')
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
            <h2 className='text-xl font-semibold mb-5'>Edit Video</h2>
            {initial ? (
                <ShopTheLookForm initial={initial} onSubmit={handleSubmit} loading={loading} submitLabel='Save Changes' />
            ) : (
                <p className='text-gray-400 text-sm'>Loading…</p>
            )}
        </div>
    )
}

export default EditShopTheLookPage
