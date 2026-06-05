'use client'

import {
    Table,
    TableBody,

    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import useFetch from "@/hooks/useFetch"
import Image from "next/image"
import notFound from '@/public/assets/images/not-found.png'
import { useEffect, useState } from "react"
import { statusBadge } from "@/lib/helperFunction"
const LatestOrder = () => {
    const [latestOrder, setLatestOrder] = useState()
    const { data, loading } = useFetch('/api/dashboard/admin/latest-order')

    useEffect(() => {
        if (data && data.success) {
            setLatestOrder(data.data)
        }
    }, [data])

    if (loading) return <div className="h-full w-full flex justify-center items-center">Loading...</div>

    if (!latestOrder || latestOrder.length === 0) return <div className="h-full w-full flex justify-center items-center">
        <Image src={notFound.src} width={notFound.width} height={notFound.height} alt="not found" className="w-20" />
    </div>

    return (
        <Table>

            <TableHeader>
                <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>

                {latestOrder?.map((order) => (
                    <TableRow key={order._id}>
                        <TableCell>{order.orderNumber || order.order_id || order._id}</TableCell>
                        <TableCell>{order?.shippingAddress?.fullName || order.name || order.email || '—'}</TableCell>
                        <TableCell>{(order.items?.length ?? order.products?.length ?? 0)}</TableCell>
                        <TableCell>{statusBadge(order.paymentStatus || 'pending')}</TableCell>
                        <TableCell>{statusBadge(order.fulfillmentStatus || 'unfulfilled')}</TableCell>
                        <TableCell>
                            {Number(order.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: order.currency || 'INR' })}
                        </TableCell>
                    </TableRow>
                ))}

            </TableBody>
        </Table>

    )
}

export default LatestOrder