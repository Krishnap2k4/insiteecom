'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_SHOP_THE_LOOK_ADD, ADMIN_SHOP_THE_LOOK_EDIT } from '@/routes/AdminPanelRoute'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: '', label: 'Shop the Look' },
]

const ShopTheLookPage = () => {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get('/api/admin/shop-the-look')
            if (data?.success) setItems(data.data)
        } catch {
            showToast('error', 'Could not load items.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return
        try {
            const { data } = await axios.delete(`/api/admin/shop-the-look/${id}`)
            if (!data?.success) throw new Error(data?.message)
            showToast('success', 'Item deleted.')
            load()
        } catch (err) {
            showToast('error', err.message)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <div className='flex justify-between items-center mb-5'>
                <h2 className='text-xl font-semibold'>Shop the Look Videos</h2>
                <Link href={ADMIN_SHOP_THE_LOOK_ADD}>
                    <Button className='cursor-pointer'><FiPlus className='mr-1' /> Add Video</Button>
                </Link>
            </div>

            {loading ? (
                <p className='text-gray-400 text-sm py-8 text-center'>Loading…</p>
            ) : items.length === 0 ? (
                <div className='border-2 border-dashed rounded-lg py-16 text-center text-gray-500'>
                    <p className='mb-3'>No video items yet.</p>
                    <Link href={ADMIN_SHOP_THE_LOOK_ADD}>
                        <Button variant='outline' className='cursor-pointer'><FiPlus className='mr-1' /> Add your first video</Button>
                    </Link>
                </div>
            ) : (
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {items.map((item) => (
                        <div key={item._id} className='border rounded-lg overflow-hidden shadow-sm bg-card flex flex-col'>
                            {/* Thumbnail */}
                            <div className='relative aspect-video bg-gray-100 dark:bg-gray-800'>
                                <Image
                                    src={item.thumbnail?.secure_url || imgPlaceholder.src}
                                    alt={item.title}
                                    fill
                                    className='object-cover'
                                />
                                <div className='absolute inset-0 flex items-center justify-center'>
                                    <div className='w-12 h-12 rounded-full bg-black/50 flex items-center justify-center'>
                                        <span className='text-white text-xl ml-0.5'>▶</span>
                                    </div>
                                </div>
                            </div>

                            <div className='p-4 flex flex-col flex-1 gap-2'>
                                <div className='flex items-start justify-between gap-2'>
                                    <h3 className='font-semibold text-sm line-clamp-1'>{item.title}</h3>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {item.isActive ? 'Active' : 'Hidden'}
                                    </span>
                                </div>

                                {item.product && (
                                    <p className='text-xs text-gray-500'>Product: <span className='font-medium text-gray-700 dark:text-gray-300'>{item.product.name}</span></p>
                                )}
                                {item.description && (
                                    <p className='text-xs text-gray-500 line-clamp-2'>{item.description}</p>
                                )}
                                <p className='text-xs text-gray-400 mt-auto'>Sort: {item.sortOrder}</p>

                                <div className='flex gap-2 mt-2'>
                                    <Link href={ADMIN_SHOP_THE_LOOK_EDIT(item._id)} className='flex-1'>
                                        <Button size='sm' variant='outline' className='w-full cursor-pointer'><FiEdit2 size={13} className='mr-1' /> Edit</Button>
                                    </Link>
                                    <Button size='sm' variant='ghost' onClick={() => handleDelete(item._id)} className='text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer'>
                                        <FiTrash2 size={13} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ShopTheLookPage
