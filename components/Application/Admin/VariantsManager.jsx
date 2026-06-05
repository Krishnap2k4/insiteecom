'use client'
import VariantFormDialog from '@/components/Application/Admin/VariantFormDialog'
import { Button } from '@/components/ui/button'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'

const formatINR = (value) =>
    Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

/**
 * Variants section on the product edit page.
 *
 * Always shows a variants table — every variant is explicit (no
 * silent "default" variants any more). Empty state nudges the admin
 * to add one so the product becomes purchasable.
 *
 * For products with `options[]` defined, the table includes one
 * column per option. For options-less products (single SKU), the
 * admin just needs one row with SKU + price + stock.
 */
const VariantsManager = ({ productId, productSlug, productOptions = [] }) => {
    const [variants, setVariants] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editId, setEditId] = useState(null)
    const [busyId, setBusyId] = useState(null)

    const load = async () => {
        if (!productId) return
        setLoading(true)
        try {
            const { data: res } = await axios.get(`/api/product-variant/by-product/${productId}`)
            if (res?.success) setVariants(res.data || [])
        } catch {
            showToast('error', 'Could not load variants.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [productId])

    const openAdd = () => {
        setEditId(null)
        setDialogOpen(true)
    }

    const openEdit = (variant) => {
        setEditId(variant._id)
        setDialogOpen(true)
    }

    const handleDelete = async (variant) => {
        if (!confirm(`Delete variant "${variant.sku}"?`)) return
        setBusyId(variant._id)
        try {
            const { data: res } = await axios.put('/api/product-variant/delete', {
                ids: [variant._id],
                deleteType: 'SD',
            })
            if (!res?.success) throw new Error(res?.message || 'Could not delete variant.')
            showToast('success', res.message)
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusyId(null)
        }
    }

    if (loading) {
        return <div className='py-8 text-center text-gray-400'>Loading variants…</div>
    }

    const hasOptions = Array.isArray(productOptions) && productOptions.length > 0
    const optionColumns = hasOptions ? productOptions : []

    const valueFor = (variant, optName) => {
        if (Array.isArray(variant.optionValues)) {
            const hit = variant.optionValues.find((ov) => ov.name === optName)
            if (hit) return hit.value
        }
        if (/color/i.test(optName)) return variant.color || ''
        if (/size/i.test(optName)) return variant.size || ''
        return ''
    }

    return (
        <div>
            <div className='flex justify-between items-start gap-3 mb-4 flex-wrap'>
                <p className='text-sm text-gray-600'>
                    {variants.length === 0 ? (
                        hasOptions
                            ? <>Options are defined ({productOptions.map((o) => o.name).join(' / ')}). Add at least one variant to make this product purchasable.</>
                            : <>This product has no options. Add a single variant with the SKU, price and stock to make it purchasable.</>
                    ) : (
                        <><strong>{variants.length}</strong> variant{variants.length === 1 ? '' : 's'}.</>
                    )}
                </p>
                <Button type='button' onClick={openAdd} className='cursor-pointer'>
                    <FiPlus className='mr-1' /> Add variant
                </Button>
            </div>

            {variants.length === 0 ? (
                <div className='py-10 text-center text-gray-500 border-2 border-dashed rounded'>
                    <FiAlertTriangle className='mx-auto text-amber-500 mb-3' size={32} />
                    <p className='mb-3 font-medium'>No variants yet — product is not purchasable</p>
                    <p className='mb-4 text-sm'>Add at least one variant so customers can buy this product.</p>
                    <Button type='button' onClick={openAdd} className='cursor-pointer'>
                        <FiPlus className='mr-1' /> Add the first variant
                    </Button>
                </div>
            ) : (
                <div className='overflow-x-auto border rounded'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-50 border-b'>
                            <tr className='text-left'>
                                <th className='p-3 font-medium'>SKU</th>
                                {optionColumns.map((o) => (
                                    <th key={o.name} className='p-3 font-medium'>{o.name}</th>
                                ))}
                                <th className='p-3 font-medium text-right'>MRP</th>
                                <th className='p-3 font-medium text-right'>Selling</th>
                                <th className='p-3 font-medium text-right'>Stock</th>
                                <th className='p-3 font-medium'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((v) => {
                                const stock = v.inventory?.available ?? 0
                                const lowStock = v.inventory && stock <= (v.inventory.reorderLevel || 0)
                                const outOfStock = v.inventory && stock === 0
                                return (
                                    <tr key={v._id} className='border-b hover:bg-gray-50'>
                                        <td className='p-3 font-mono text-xs'>{v.sku}</td>
                                        {optionColumns.map((o) => (
                                            <td key={o.name} className='p-3 text-gray-600'>{valueFor(v, o.name) || <span className='text-gray-400'>—</span>}</td>
                                        ))}
                                        <td className='p-3 text-right'>{formatINR(v.mrp)}</td>
                                        <td className='p-3 text-right font-medium'>{formatINR(v.sellingPrice)}</td>
                                        <td className='p-3 text-right'>
                                            {v.inventory ? (
                                                <span className={`font-medium ${outOfStock ? 'text-red-600' : lowStock ? 'text-amber-700' : ''}`}>
                                                    {stock}
                                                    {outOfStock && <FiAlertTriangle size={12} className='inline ml-1' />}
                                                </span>
                                            ) : (
                                                <span className='text-gray-400'>—</span>
                                            )}
                                        </td>
                                        <td className='p-3'>
                                            <div className='flex gap-1 justify-end'>
                                                <Button type='button' size='sm' variant='ghost' onClick={() => openEdit(v)} className='cursor-pointer'>
                                                    <FiEdit2 size={13} />
                                                </Button>
                                                <Button type='button' size='sm' variant='ghost' onClick={() => handleDelete(v)} disabled={busyId === v._id} className='cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50'>
                                                    <FiTrash2 size={13} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <VariantFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                productId={productId}
                productSlug={productSlug}
                productOptions={productOptions}
                variantId={editId}
                onSaved={load}
            />
        </div>
    )
}

export default VariantsManager
