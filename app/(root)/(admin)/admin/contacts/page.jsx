'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import ViewAction from '@/components/Application/Admin/ViewAction'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DT_CONTACT_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import {
    ADMIN_CONTACTS_SHOW,
    ADMIN_CONTACT_DETAILS,
    ADMIN_DASHBOARD,
} from '@/routes/AdminPanelRoute'
import { useCallback, useMemo } from 'react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CONTACTS_SHOW, label: 'Contact submissions' },
]

const ShowContacts = () => {
    const columns = useMemo(() => columnConfig(DT_CONTACT_COLUMN), [])
    const action = useCallback((row) => [
        <ViewAction key='view' href={ADMIN_CONTACT_DETAILS(row.original._id)} />,
    ], [])
    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className='py-0 rounded shadow-sm gap-0'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <h4 className='text-xl font-semibold'>Contact submissions</h4>
                </CardHeader>
                <CardContent className='px-0 pt-0'>
                    <DatatableWrapper
                        queryKey='contacts-data'
                        fetchUrl='/api/admin/contacts'
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

export default ShowContacts
