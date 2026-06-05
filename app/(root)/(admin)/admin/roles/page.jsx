'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@mui/material'
import axios from '@/lib/apiClient'
import { ADMIN_DASHBOARD, ADMIN_ROLES_EDIT, ADMIN_ROLES_SHOW } from '@/routes/AdminPanelRoute'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LuShieldCheck } from 'react-icons/lu'
import { FiEdit2 } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_ROLES_SHOW, label: 'Roles & Permissions' },
]

const RolesPage = () => {
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const { data: res } = await axios.get('/api/admin/roles')
                if (res?.success) setRoles(res.data || [])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <Card className="py-0 rounded shadow-sm gap-0">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className='text-xl font-semibold flex items-center gap-2'>
                                <LuShieldCheck /> Roles & Permissions
                            </h4>
                            <p className='text-sm text-gray-500 mt-1'>
                                Bundles of permissions that can be assigned to admin users. System roles are protected and cannot be deleted.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="py-5">
                    {loading && (
                        <div className='grid md:grid-cols-2 gap-4'>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className='border rounded-lg p-5 animate-pulse'>
                                    <div className='h-5 w-1/3 bg-gray-200 rounded mb-2'></div>
                                    <div className='h-3 w-2/3 bg-gray-100 rounded mb-3'></div>
                                    <div className='h-3 w-1/4 bg-gray-100 rounded'></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && roles.length === 0 && (
                        <div className='py-10 text-center text-gray-500'>
                            <p className='mb-3'>No roles found. Run the RBAC seeder to populate defaults.</p>
                            <code className='text-xs bg-gray-100 px-2 py-1 rounded'>
                                POST /api/maintenance/seed-rbac
                            </code>
                        </div>
                    )}

                    {!loading && roles.length > 0 && (
                        <div className='grid md:grid-cols-2 gap-4'>
                            {roles.map((role) => (
                                <div key={role._id} className='border rounded-lg p-5 hover:border-gray-300 transition'>
                                    <div className='flex items-start justify-between gap-3 mb-2'>
                                        <div className='min-w-0'>
                                            <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                                <h4 className='font-semibold'>{role.name}</h4>
                                                {role.isSystem && (
                                                    <Chip size='small' label='System' color='primary' variant='outlined' />
                                                )}
                                            </div>
                                            <p className='text-xs text-gray-500 font-mono'>{role.code}</p>
                                        </div>
                                        <Button asChild size='sm' variant='ghost' className='cursor-pointer'>
                                            <Link href={ADMIN_ROLES_EDIT(role._id)}>
                                                <FiEdit2 size={14} className='mr-1' /> Edit
                                            </Link>
                                        </Button>
                                    </div>
                                    <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                                        {role.description || 'No description.'}
                                    </p>
                                    <div className='text-sm'>
                                        <span className='font-medium'>{role.permissions?.length || 0}</span>
                                        <span className='text-gray-500'> permission{role.permissions?.length === 1 ? '' : 's'}</span>
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

export default RolesPage
