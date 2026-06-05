'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import ViewAction from '@/components/Application/Admin/ViewAction'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DT_REFUND_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import {
    ADMIN_DASHBOARD,
    ADMIN_ORDER_DETAILS,
    ADMIN_REFUND_SHOW,
} from '@/routes/AdminPanelRoute'
import { useCallback, useMemo } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_REFUND_SHOW, label: 'Refunds' },
]

const ShowRefunds = () => {
    const columns = useMemo(() => columnConfig(DT_REFUND_COLUMN), [])
    const action = useCallback((row) => {
        const ref = row.original.orderNumber || row.original.orderLegacyId
        return [<ViewAction key='view' href={ADMIN_ORDER_DETAILS(ref)} />]
    }, [])

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className='py-0 rounded shadow-sm gap-0'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <div className='flex justify-between items-center'>
                        <h4 className='text-xl font-semibold'>Refunds</h4>
                    </div>
                </CardHeader>
                <CardContent className='px-0 pt-0'>
                    <DatatableWrapper
                        queryKey='refunds-data'
                        fetchUrl='/api/admin/refunds'
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

export default ShowRefunds
