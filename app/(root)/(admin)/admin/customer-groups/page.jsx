'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@mui/material'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_CUSTOMER_GROUPS_ADD, ADMIN_CUSTOMER_GROUPS_EDIT, ADMIN_CUSTOMER_GROUPS_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { LuUsersRound } from 'react-icons/lu'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CUSTOMER_GROUPS_SHOW, label: 'Customer Groups' },
]

const CustomerGroupsPage = () => {
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState(null)

    const load = async () => {
        try {
            const { data: res } = await axios.get('/api/admin/customer-groups')
            if (res?.success) setGroups(res.data || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleDelete = async (group) => {
        if (!confirm(`Delete customer group "${group.name}"?`)) return
        setBusyId(group._id)
        try {
            const { data: res } = await axios.delete(`/api/admin/customer-groups/${group._id}`)
            if (!res?.success) throw new Error(res?.message || 'Could not delete.')
            showToast('success', res.message)
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <Card className="py-0 rounded shadow-sm gap-0">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <div className="flex justify-between items-center gap-3">
                        <div>
                            <h4 className='text-xl font-semibold flex items-center gap-2'>
                                <LuUsersRound /> Customer Groups
                            </h4>
                            <p className='text-sm text-gray-500 mt-1'>
                                Tiers for grouping customers — used by marketing rules in a later module. System groups cannot be deleted.
                            </p>
                        </div>
                        <Button asChild className='cursor-pointer'>
                            <Link href={ADMIN_CUSTOMER_GROUPS_ADD}>
                                <FiPlus className='mr-1' /> New Group
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="py-5">
                    {loading && (
                        <div className='grid md:grid-cols-2 gap-4'>
                            {[0, 1].map((i) => (
                                <div key={i} className='border rounded-lg p-5 animate-pulse'>
                                    <div className='h-5 w-1/3 bg-gray-200 rounded mb-2'></div>
                                    <div className='h-3 w-2/3 bg-gray-100 rounded'></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && groups.length === 0 && (
                        <div className='py-10 text-center text-gray-500'>
                            <p>No customer groups yet. Run the RBAC seeder to create the default <code className='text-xs bg-gray-100 px-1 py-0.5 rounded'>retail</code> group, or create one above.</p>
                        </div>
                    )}

                    {!loading && groups.length > 0 && (
                        <div className='grid md:grid-cols-2 gap-4'>
                            {groups.map((group) => (
                                <div key={group._id} className={`relative border rounded-lg p-5 transition ${group.isDefault ? 'border-primary shadow-sm bg-primary/5' : 'hover:border-gray-300'}`}>
                                    <div className='flex items-start justify-between gap-3 mb-2'>
                                        <div className='min-w-0'>
                                            <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                                <h4 className='font-semibold'>{group.name}</h4>
                                                {group.isSystem && <Chip size='small' label='System' color='primary' variant='outlined' />}
                                                {group.isDefault && <Chip size='small' label='Default' color='success' />}
                                                {group.taxExempt && <Chip size='small' label='Tax exempt' variant='outlined' />}
                                            </div>
                                            <p className='text-xs text-gray-500 font-mono'>{group.code}</p>
                                        </div>
                                    </div>
                                    <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                                        {group.description || 'No description.'}
                                    </p>
                                    <div className='text-sm mb-4'>
                                        <span className='text-gray-500'>Discount: </span>
                                        <span className='font-medium'>{group.discountPercent}%</span>
                                    </div>
                                    <div className='flex gap-2'>
                                        <Button asChild size='sm' variant='outline' className='cursor-pointer'>
                                            <Link href={ADMIN_CUSTOMER_GROUPS_EDIT(group._id)}>
                                                <FiEdit2 size={14} className='mr-1' /> Edit
                                            </Link>
                                        </Button>
                                        {!group.isSystem && (
                                            <Button
                                                type='button'
                                                size='sm'
                                                variant='ghost'
                                                onClick={() => handleDelete(group)}
                                                disabled={busyId === group._id}
                                                className='cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50'
                                            >
                                                <FiTrash2 size={14} className='mr-1' /> Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomerGroupsPage
