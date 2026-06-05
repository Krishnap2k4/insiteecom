'use client'
import MediaModal from '@/components/Application/Admin/MediaModal'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Select from '@/components/Application/Select'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

/**
 * Add / edit a single variant of a given product (Shopify-style).
 *
 * Each Option on the parent product becomes a dropdown sourced from
 * that option's predefined values. No free-text color / size, no
 * separate attributes editor — the data model is one thing.
 *
 * Props:
 *   open, onOpenChange
 *   productId
 *   productSlug
 *   productOptions      — the product's options[] (name + values[])
 *   variantId           — present → edit mode (loads via API)
 *                         absent  → add mode
 *   onSaved             — called after a successful create/update
 */
const VariantFormDialog = ({
    open, onOpenChange,
    productId, productSlug, productOptions = [],
    variantId, onSaved,
}) => {
    const isEdit = Boolean(variantId)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [sku, setSku] = useState('')
    const [optionValues, setOptionValues] = useState({})
    const [mrp, setMrp] = useState('')
    const [sellingPrice, setSellingPrice] = useState('')
    const [discountPercentage, setDiscountPercentage] = useState(0)
    const [media, setMedia] = useState([])
    const [mediaModalOpen, setMediaModalOpen] = useState(false)

    // Discount auto-derive.
    useEffect(() => {
        const m = Number(mrp) || 0
        const s = Number(sellingPrice) || 0
        if (m > 0 && s > 0) {
            setDiscountPercentage(Math.max(0, Math.round(((m - s) / m) * 100)))
        } else {
            setDiscountPercentage(0)
        }
    }, [mrp, sellingPrice])

    useEffect(() => {
        if (!open) return
        if (isEdit) {
            setLoading(true)
            const load = async () => {
                try {
                    const { data: res } = await axios.get(`/api/product-variant/get/${variantId}`)
                    if (res?.success) {
                        const v = res.data
                        setSku(v.sku || '')
                        setMrp(v.mrp ?? '')
                        setSellingPrice(v.sellingPrice ?? '')
                        setDiscountPercentage(v.discountPercentage ?? 0)
                        if (Array.isArray(v.media)) {
                            setMedia(v.media.map((m) => ({ _id: m._id, url: m.secure_url })))
                        }
                        // Build optionValues map keyed by option name.
                        const next = {}
                        if (Array.isArray(v.optionValues) && v.optionValues.length > 0) {
                            for (const ov of v.optionValues) next[ov.name] = ov.value
                        } else {
                            // Legacy fallback for unmigrated variants.
                            for (const opt of productOptions) {
                                if (/color/i.test(opt.name)) next[opt.name] = v.color || ''
                                if (/size/i.test(opt.name)) next[opt.name] = v.size || ''
                            }
                        }
                        setOptionValues(next)
                    } else {
                        showToast('error', 'Could not load variant.')
                    }
                } finally {
                    setLoading(false)
                }
            }
            load()
        } else {
            setSku(productSlug ? `${productSlug.toUpperCase()}-` : '')
            setOptionValues({})
            setMrp('')
            setSellingPrice('')
            setDiscountPercentage(0)
            setMedia([])
        }
    }, [open, isEdit, variantId, productSlug, productOptions])

    const setOptionValue = (name, value) => setOptionValues((prev) => ({ ...prev, [name]: value }))

    const payload = useMemo(() => ({
        product: productId,
        sku: sku.trim(),
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        discountPercentage: Number(discountPercentage) || 0,
        media: media.map((m) => m._id),
        optionValues: productOptions
            .filter((o) => optionValues[o.name])
            .map((o) => ({ name: o.name, value: optionValues[o.name] })),
    }), [productId, sku, mrp, sellingPrice, discountPercentage, media, optionValues, productOptions])

    const handleSubmit = async () => {
        if (!payload.sku) return showToast('error', 'SKU is required.')
        if (!payload.product) return showToast('error', 'Product is missing.')
        if (!(payload.mrp > 0)) return showToast('error', 'MRP must be greater than 0.')
        if (!(payload.sellingPrice > 0)) return showToast('error', 'Selling price must be greater than 0.')
        if (payload.media.length === 0) return showToast('error', 'Pick at least one image.')
        // Every option needs a value if options are defined on the product.
        for (const opt of productOptions) {
            if (!optionValues[opt.name]) {
                return showToast('error', `Pick a value for "${opt.name}".`)
            }
        }

        setSaving(true)
        try {
            const { data: res } = isEdit
                ? await axios.put('/api/product-variant/update', { _id: variantId, ...payload })
                : await axios.post('/api/product-variant/create', payload)

            if (!res?.success) throw new Error(res?.message || 'Could not save variant.')
            showToast('success', res.message)
            onOpenChange(false)
            onSaved && onSaved()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit variant' : 'Add variant'}</DialogTitle>
                    <DialogDescription>
                        {productOptions.length === 0
                            ? (isEdit
                                ? 'Update SKU, price or media for this variant.'
                                : 'Single-SKU product — set SKU, price and media. Add options on the product if it needs multiple variants.')
                            : (isEdit
                                ? 'Update SKU, option values, price or media for this variant.'
                                : 'Pick a value for every product option, then set SKU, price and media.')}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className='py-10 text-center text-gray-400'>Loading…</div>
                ) : (
                    <div className='space-y-5'>
                        <div className='grid md:grid-cols-2 gap-4'>
                            {productOptions.map((opt) => (
                                <div key={opt.name}>
                                    <Label className='mb-2 block'>{opt.name} <span className='text-red-500'>*</span></Label>
                                    <Select
                                        options={(opt.values || []).map((v) => ({ value: v, label: v }))}
                                        selected={optionValues[opt.name] || ''}
                                        setSelected={(v) => setOptionValue(opt.name, v)}
                                        isMulti={false}
                                        placeholder={`Pick ${opt.name.toLowerCase()}`}
                                    />
                                </div>
                            ))}
                            <div>
                                <Label className='mb-2 block'>SKU <span className='text-red-500'>*</span></Label>
                                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder='Unique SKU' />
                            </div>
                        </div>

                        <div className='grid md:grid-cols-3 gap-4'>
                            <div>
                                <Label className='mb-2 block'>MRP <span className='text-red-500'>*</span></Label>
                                <Input type='number' value={mrp} onChange={(e) => setMrp(e.target.value)} />
                            </div>
                            <div>
                                <Label className='mb-2 block'>Selling price <span className='text-red-500'>*</span></Label>
                                <Input type='number' value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
                            </div>
                            <div>
                                <Label className='mb-2 block'>Discount %</Label>
                                <Input type='number' readOnly value={discountPercentage} />
                            </div>
                        </div>

                        <div>
                            <Label className='mb-2 block'>Media <span className='text-red-500'>*</span></Label>
                            <div className='border border-dashed rounded p-4'>
                                <MediaModal
                                    open={mediaModalOpen}
                                    setOpen={setMediaModalOpen}
                                    selectedMedia={media}
                                    setSelectedMedia={setMedia}
                                    isMultiple={true}
                                />
                                {media.length > 0 && (
                                    <div className='flex flex-wrap justify-center gap-2 mb-3'>
                                        {media.map((m) => (
                                            <div key={m._id} className='h-20 w-20 border rounded overflow-hidden'>
                                                <Image src={m.url} width={80} height={80} alt='' className='w-full h-full object-cover' />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div onClick={() => setMediaModalOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-3 cursor-pointer text-center'>
                                    <span className='font-semibold text-sm'>{media.length > 0 ? 'Change media' : 'Select media'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type='button' variant='outline' onClick={() => onOpenChange(false)} className='cursor-pointer'>Cancel</Button>
                    <ButtonLoading
                        loading={saving}
                        type='button'
                        text={isEdit ? 'Save variant' : 'Add variant'}
                        onClick={handleSubmit}
                        className='cursor-pointer'
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default VariantFormDialog
