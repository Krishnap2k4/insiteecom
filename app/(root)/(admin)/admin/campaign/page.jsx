'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import DeleteAction from '@/components/Application/Admin/DeleteAction'
import EditAction from '@/components/Application/Admin/EditAction'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DT_CAMPAIGN_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import {
    ADMIN_CAMPAIGN_ADD,
    ADMIN_CAMPAIGN_EDIT,
    ADMIN_CAMPAIGN_SHOW,
    ADMIN_DASHBOARD,
    ADMIN_TRASH,
} from '@/routes/AdminPanelRoute'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { FiPlus } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CAMPAIGN_SHOW, label: 'Campaigns' },
]

const ShowCampaigns = () => {
    const columns = useMemo(() => columnConfig(DT_CAMPAIGN_COLUMN), [])
    const action = useCallback((row, deleteType, handleDelete) => [
        <EditAction key='edit' href={ADMIN_CAMPAIGN_EDIT(row.original._id)} />,
        <DeleteAction key='delete' handleDelete={handleDelete} row={row} deleteType={deleteType} />,
    ], [])

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className='py-0 rounded shadow-sm gap-0'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <div className='flex justify-between items-center'>
                        <h4 className='text-xl font-semibold'>Campaigns</h4>
                        <Button type='button' size='sm' asChild>
                            <Link href={ADMIN_CAMPAIGN_ADD} className='inline-flex items-center gap-1'>
                                <FiPlus /> New campaign
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='px-0 pt-0'>
                    <DatatableWrapper
                        queryKey='campaigns-data'
                        fetchUrl='/api/admin/campaign'
                        deleteEndpoint='/api/admin/campaign'
                        initialPageSize={10}
                        columnsConfig={columns}
                        deleteType='SD'
                        trashView={`${ADMIN_TRASH}?trashof=campaigns`}
                        createAction={action}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowCampaigns
