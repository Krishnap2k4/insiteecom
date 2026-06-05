'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import ViewAction from '@/components/Application/Admin/ViewAction'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DT_SUPPORT_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import {
    ADMIN_DASHBOARD,
    ADMIN_SUPPORT_DETAILS,
    ADMIN_SUPPORT_SHOW,
} from '@/routes/AdminPanelRoute'
import { useCallback, useMemo } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SUPPORT_SHOW, label: 'Support' },
]

const ShowSupport = () => {
    const columns = useMemo(() => columnConfig(DT_SUPPORT_COLUMN), [])
    const action = useCallback((row) => [
        <ViewAction key='view' href={ADMIN_SUPPORT_DETAILS(row.original._id)} />,
    ], [])

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className='py-0 rounded shadow-sm gap-0'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <h4 className='text-xl font-semibold'>Support inbox</h4>
                </CardHeader>
                <CardContent className='px-0 pt-0'>
                    <DatatableWrapper
                        queryKey='support-data'
                        fetchUrl='/api/admin/support'
                        initialPageSize={10}
                        columnsConfig={columns}
                        deleteType='SD'
                        createAction={action}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowSupport
