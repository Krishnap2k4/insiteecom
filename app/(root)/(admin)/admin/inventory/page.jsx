'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_INVENTORY_SHOW } from '@/routes/AdminPanelRoute'
import { Chip } from '@mui/material'
import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiBox, FiEdit2, FiRefreshCw } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_INVENTORY_SHOW, label: 'Inventory' },
]

const PAGE_SIZE = 25

const InventoryPage = () => {
    const [items, setItems] = useState([])
    const [meta, setMeta] = useState({ totalRowCount: 0 })
    const [page, setPage] = useState(0)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [adjustOpen, setAdjustOpen] = useState(false)
    const [adjustTarget, setAdjustTarget] = useState(null)
    const [adjustMode, setAdjustMode] = useState('set')
    const [adjustQty, setAdjustQty] = useState(0)
    const [adjustReorder, setAdjustReorder] = useState(0)
    const [adjustReason, setAdjustReason] = useState('')
    const [adjustSaving, setAdjustSaving] = useState(false)

    const load = async (pageArg = page, searchArg = search) => {
        setLoading(true)
        try {
            const start = pageArg * PAGE_SIZE
            const params = new URLSearchParams({
                start: String(start),
                size: String(PAGE_SIZE),
                deleteType: 'SD',
                globalFilter: searchArg,
                filters: '[]',
                sorting: '[]',
            })
            const { data: res } = await axios.get(`/api/admin/inventory?${params.toString()}`)
            if (res?.success) {
                setItems(res.data || [])
                setMeta(res.meta || { totalRowCount: 0 })
            }
        } catch {
            showToast('error', 'Could not load inventory.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const openAdjust = (row) => {
        setAdjustTarget(row)
        setAdjustMode('set')
        setAdjustQty(row.quantity ?? 0)
        setAdjustReorder(row.reorderLevel ?? 0)
        setAdjustReason('')
        setAdjustOpen(true)
    }

    const submitAdjust = async () => {
        if (!adjustTarget) return
        setAdjustSaving(true)
        try {
            const { data: res } = await axios.post(`/api/admin/inventory/${adjustTarget._id}/adjust`, {
                mode: adjustMode,
                quantity: Number(adjustQty),
                reorderLevel: Number(adjustReorder),
                reason: adjustReason,
            })
            if (!res?.success) throw new Error(res?.message || 'Could not save.')
            showToast('success', res.message)
            setAdjustOpen(false)
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setAdjustSaving(false)
        }
    }

    const totalPages = Math.max(1, Math.ceil((meta.totalRowCount || 0) / PAGE_SIZE))

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className="py-0 rounded shadow-sm gap-0">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <div className='flex justify-between items-center gap-3 flex-wrap'>
                        <div>
                            <h4 className='text-xl font-semibold flex items-center gap-2'>
                                <FiBox /> Inventory
                            </h4>
                            <p className='text-sm text-gray-500 mt-1'>
                                One row per variant per warehouse. Yellow rows are at or below reorder level.
                            </p>
                        </div>
                        <div className='flex gap-2 items-center'>
                            <Input
                                placeholder='Search SKU or product…'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); load(0, search) } }}
                                className='w-64'
                            />
                            <Button type='button' variant='outline' onClick={() => load()} className='cursor-pointer'>
                                <FiRefreshCw size={14} className='mr-1' /> Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className='p-0'>
                    {loading ? (
                        <div className='py-10 text-center text-gray-400'>Loading…</div>
                    ) : items.length === 0 ? (
                        <div className='py-10 text-center text-gray-500'>
                            <p>No inventory rows yet. Run the catalog migration to seed one row per variant.</p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead className='bg-gray-50 border-b'>
                                    <tr className='text-left'>
                                        <th className='p-3 font-medium'>Product</th>
                                        <th className='p-3 font-medium'>SKU</th>
                                        <th className='p-3 font-medium'>Axes</th>
                                        <th className='p-3 font-medium text-right'>Qty</th>
                                        <th className='p-3 font-medium text-right'>Reserved</th>
                                        <th className='p-3 font-medium text-right'>Available</th>
                                        <th className='p-3 font-medium text-right'>Reorder</th>
                                        <th className='p-3 font-medium'>Status</th>
                                        <th className='p-3 font-medium'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((row) => {
                                        const isLow = row.lowStock
                                        const isOut = (row.available || 0) === 0
                                        return (
                                            <tr key={row._id} className={`border-b hover:bg-gray-50 ${isLow ? 'bg-amber-50' : ''}`}>
                                                <td className='p-3'>{row.product || <span className='text-gray-400'>—</span>}</td>
                                                <td className='p-3 font-mono text-xs'>{row.sku || '—'}</td>
                                                <td className='p-3 text-xs text-gray-600'>
                                                    {[row.color, row.sizeAxis].filter(Boolean).join(' · ') || <span className='text-gray-400'>—</span>}
                                                </td>
                                                <td className='p-3 text-right font-medium'>{row.quantity}</td>
                                                <td className='p-3 text-right'>{row.reserved}</td>
                                                <td className={`p-3 text-right font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-700' : ''}`}>
                                                    {row.available}
                                                </td>
                                                <td className='p-3 text-right text-gray-500'>{row.reorderLevel}</td>
                                                <td className='p-3'>
                                                    {isOut ? (
                                                        <Chip size='small' color='error' label='Out of stock' />
                                                    ) : isLow ? (
                                                        <Chip size='small' color='warning' label='Low' icon={<FiAlertTriangle size={12} style={{ marginLeft: 4 }} />} />
                                                    ) : (
                                                        <Chip size='small' color='success' label='In stock' />
                                                    )}
                                                </td>
                                                <td className='p-3'>
                                                    <Button type='button' size='sm' variant='ghost' onClick={() => openAdjust(row)} className='cursor-pointer'>
                                                        <FiEdit2 size={13} className='mr-1' /> Adjust
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className='flex justify-between items-center p-3 border-t text-sm text-gray-600'>
                            <span>
                                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, meta.totalRowCount)} of {meta.totalRowCount}
                            </span>
                            <div className='flex gap-2'>
                                <Button type='button' size='sm' variant='outline' onClick={() => { const p = Math.max(0, page - 1); setPage(p); load(p, search) }} disabled={page === 0} className='cursor-pointer'>
                                    Previous
                                </Button>
                                <Button type='button' size='sm' variant='outline' onClick={() => { const p = Math.min(totalPages - 1, page + 1); setPage(p); load(p, search) }} disabled={page >= totalPages - 1} className='cursor-pointer'>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust stock</DialogTitle>
                        <DialogDescription>
                            {adjustTarget?.product} {adjustTarget?.sku ? `· ${adjustTarget.sku}` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4'>
                        <div className='flex gap-2 items-center text-sm'>
                            <span className='text-gray-500'>Mode:</span>
                            <Button type='button' size='sm' variant={adjustMode === 'set' ? 'default' : 'outline'} onClick={() => setAdjustMode('set')} className='cursor-pointer'>
                                Set absolute
                            </Button>
                            <Button type='button' size='sm' variant={adjustMode === 'delta' ? 'default' : 'outline'} onClick={() => setAdjustMode('delta')} className='cursor-pointer'>
                                Add / subtract
                            </Button>
                        </div>

                        <div>
                            <label className='text-sm font-medium block mb-1'>
                                {adjustMode === 'set' ? 'New quantity' : 'Delta (negative subtracts)'}
                            </label>
                            <Input type='number' value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
                            {adjustMode === 'set' && (
                                <p className='text-xs text-gray-500 mt-1'>Current: {adjustTarget?.quantity ?? 0}</p>
                            )}
                        </div>

                        <div>
                            <label className='text-sm font-medium block mb-1'>Reorder level</label>
                            <Input type='number' value={adjustReorder} onChange={(e) => setAdjustReorder(e.target.value)} />
                            <p className='text-xs text-gray-500 mt-1'>Highlight as low when available stock falls to this number.</p>
                        </div>

                        <div>
                            <label className='text-sm font-medium block mb-1'>Reason (optional)</label>
                            <Textarea rows={2} placeholder='Stock received, damaged goods, audit correction…' value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={() => setAdjustOpen(false)} className='cursor-pointer'>Cancel</Button>
                        <ButtonLoading loading={adjustSaving} type='button' text='Save adjustment' onClick={submitAdjust} className='cursor-pointer' />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default InventoryPage
