'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import ViewAction from '@/components/Application/Admin/ViewAction'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DT_NEWSLETTER_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import { ADMIN_DASHBOARD, ADMIN_NEWSLETTER_SHOW } from '@/routes/AdminPanelRoute'
import { useCallback, useMemo } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_NEWSLETTER_SHOW, label: 'Newsletter' },
]

const ShowNewsletter = () => {
    const columns = useMemo(() => columnConfig(DT_NEWSLETTER_COLUMN), [])
    const action = useCallback((row) => [
        <ViewAction key='view' href={`mailto:${row.original.email}`} />,
    ], [])

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className='py-0 rounded shadow-sm gap-0'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <div className='flex justify-between items-center'>
                        <h4 className='text-xl font-semibold'>Newsletter subscribers</h4>
                    </div>
                </CardHeader>
                <CardContent className='px-0 pt-0'>
                    <DatatableWrapper
                        queryKey='newsletter-data'
                        fetchUrl='/api/admin/newsletter'
                        exportEndpoint='/api/admin/newsletter/export'
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

export default ShowNewsletter
