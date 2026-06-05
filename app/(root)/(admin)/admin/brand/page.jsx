'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import EditAction from "@/components/Application/Admin/EditAction"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DT_BRAND_COLUMN } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_BRAND_ADD, ADMIN_BRAND_EDIT, ADMIN_BRAND_SHOW, ADMIN_DASHBOARD, ADMIN_TRASH } from "@/routes/AdminPanelRoute"
import Link from "next/link"
import { useCallback, useMemo } from "react"
import { FiPlus } from "react-icons/fi"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_BRAND_SHOW, label: 'Brand' },
]

const ShowBrand = () => {
    const columns = useMemo(() => columnConfig(DT_BRAND_COLUMN), [])

    const action = useCallback((row, deleteType, handleDelete) => {
        const menu = []
        menu.push(<EditAction key="edit" href={ADMIN_BRAND_EDIT(row.original._id)} />)
        if (!row.original.isSystem) {
            menu.push(<DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />)
        }
        return menu
    }, [])

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className="py-0 rounded shadow-sm gap-0">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <div className="flex justify-between items-center">
                        <h4 className='text-xl font-semibold'>Show Brands</h4>
                        <Button asChild>
                            <Link href={ADMIN_BRAND_ADD}>
                                <FiPlus /> New Brand
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                    <DatatableWrapper
                        queryKey="brand-data"
                        fetchUrl="/api/brand"
                        initialPageSize={10}
                        columnsConfig={columns}
                        deleteEndpoint="/api/brand/delete"
                        deleteType="SD"
                        trashView={`${ADMIN_TRASH}?trashof=brand`}
                        createAction={action}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowBrand
