'use client'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Select from '@/components/Application/Select'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'

/**
 * Sectioned admin form for creating / editing coupons. Shared by
 * `/admin/coupon/add` and `/admin/coupon/edit/[id]` so the two pages
 * stay in lockstep.
 *
 * Props:
 *   initial         — populated values (edit mode) or undefined (add)
 *   submitLabel     — button text
 *   onSubmit        — async (payload) => void; payload matches the
 *                     coupon CRUD endpoints
 *   loading         — outer-controlled submit spinner
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const formSchema = z.object({
    code: z.string().trim().min(3, 'Code must be at least 3 characters'),
    description: z.string().trim().optional().default(''),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.coerce.number().nonnegative(),
    maxDiscountAmount: z.union([z.coerce.number().nonnegative(), z.literal(''), z.null()]).optional(),
    minOrderValue: z.coerce.number().nonnegative().optional().default(0),
    usageLimit: z.union([z.coerce.number().int().nonnegative(), z.literal(''), z.null()]).optional(),
    usagePerUser: z.union([z.coerce.number().int().nonnegative(), z.literal(''), z.null()]).optional(),
    applicableCategories: z.array(objectId).optional().default([]),
    applicableProducts: z.array(objectId).optional().default([]),
    excludedProducts: z.array(objectId).optional().default([]),
    customerGroups: z.array(objectId).optional().default([]),
    firstOrderOnly: z.boolean().optional().default(false),
    startsAt: z.string().optional(),
    endsAt: z.string().min(1, 'End date is required'),
    status: z.enum(['draft', 'active', 'paused', 'expired']),
    automatic: z.boolean().optional().default(false),
    stackable: z.boolean().optional().default(false),
})

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'expired', label: 'Expired' },
]
const DISCOUNT_TYPE_OPTIONS = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed amount' },
]

const Section = ({ title, hint, children }) => (
    <Card className='py-0 rounded shadow-sm'>
        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
            <h4 className='text-base font-semibold'>{title}</h4>
            {hint && <p className='text-xs text-gray-500 mt-0.5'>{hint}</p>}
        </CardHeader>
        <CardContent className='pb-5 pt-4'>{children}</CardContent>
    </Card>
)

const toDateInput = (value) => {
    if (!value) return ''
    try { return new Date(value).toISOString().slice(0, 10) } catch { return '' }
}

const CouponForm = ({ initial = {}, submitLabel = 'Save coupon', onSubmit, loading }) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: initial.code || '',
            description: initial.description || '',
            discountType: initial.discountType || 'percentage',
            discountValue: initial.discountValue ?? initial.discountPercentage ?? '',
            maxDiscountAmount: initial.maxDiscountAmount ?? '',
            minOrderValue: initial.minOrderValue ?? initial.minShoppingAmount ?? 0,
            usageLimit: initial.usageLimit ?? '',
            usagePerUser: initial.usagePerUser ?? '',
            applicableCategories: (initial.applicableCategories || []).map((x) => String(x?._id || x)),
            applicableProducts: (initial.applicableProducts || []).map((x) => String(x?._id || x)),
            excludedProducts: (initial.excludedProducts || []).map((x) => String(x?._id || x)),
            customerGroups: (initial.customerGroups || []).map((x) => String(x?._id || x)),
            firstOrderOnly: Boolean(initial.firstOrderOnly),
            startsAt: toDateInput(initial.startsAt) || '',
            endsAt: toDateInput(initial.endsAt || initial.validity) || '',
            status: initial.status || 'active',
            automatic: Boolean(initial.automatic),
            stackable: Boolean(initial.stackable),
        },
    })

    const discountType = form.watch('discountType')

    const { data: catData } = useFetch('/api/category/tree')
    const { data: groupData } = useFetch('/api/admin/customer-groups')
    const liveCategoryOptions = useMemo(() => {
        const flat = []
        const walk = (nodes, depth = 0) => {
            for (const n of (nodes || [])) {
                flat.push({ value: String(n._id), label: `${'— '.repeat(depth)}${n.name}` })
                if (n.children?.length) walk(n.children, depth + 1)
            }
        }
        walk(catData?.data || [])
        return flat
    }, [catData])
    const liveGroupOptions = useMemo(() => (groupData?.data || []).map((g) => ({ value: String(g._id), label: g.name })), [groupData])

    // Product picker uses an async search; for simplicity we paginate
    // the regular admin product list.
    const [productSearch, setProductSearch] = useState('')
    const { data: productData } = useFetch(
        productSearch.length >= 2
            ? `/api/product?start=0&size=20&globalFilter=${encodeURIComponent(productSearch)}&filters=[]&sorting=[]&deleteType=SD`
            : null
    )
    const liveProductOptions = useMemo(() => (productData?.data || []).map((p) => ({ value: String(p._id), label: p.name || p.slug })), [productData])

    // Seed options from the populated initial refs so badges show
    // real labels even before / when the live fetches don't include
    // them (deleted, paginated past, or just not yet loaded).
    const seedFromObjs = (arr, fmt) => (arr || [])
        .filter((x) => x && typeof x === 'object' && x._id)
        .map((x) => ({ value: String(x._id), label: fmt(x) }))

    const mergeOptions = (live, seed) => {
        const seen = new Set(live.map((o) => o.value))
        return [...live, ...seed.filter((s) => !seen.has(s.value))]
    }
    const categoryOptions = useMemo(
        () => mergeOptions(liveCategoryOptions, seedFromObjs(initial.applicableCategories, (c) => c.name || c.slug)),
        [liveCategoryOptions, initial.applicableCategories],
    )
    const groupOptions = useMemo(
        () => mergeOptions(liveGroupOptions, seedFromObjs(initial.customerGroups, (g) => g.name)),
        [liveGroupOptions, initial.customerGroups],
    )
    const productOptions = useMemo(() => {
        const seed = [
            ...seedFromObjs(initial.applicableProducts, (p) => p.name || p.slug),
            ...seedFromObjs(initial.excludedProducts, (p) => p.name || p.slug),
        ]
        return mergeOptions(liveProductOptions, seed)
    }, [liveProductOptions, initial.applicableProducts, initial.excludedProducts])

    const handleSubmit = async (values) => {
        // Normalise null-ish fields the API expects.
        const payload = {
            ...values,
            maxDiscountAmount: values.maxDiscountAmount === '' ? null : values.maxDiscountAmount,
            usageLimit: values.usageLimit === '' ? null : values.usageLimit,
            usagePerUser: values.usagePerUser === '' ? null : values.usagePerUser,
            startsAt: values.startsAt || undefined,
            endsAt: values.endsAt,
        }
        try { await onSubmit(payload) } catch (err) { showToast('error', err.message) }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-5'>
                <Section title='Code & description' hint='Customers type this code at checkout.'>
                    <div className='grid md:grid-cols-2 gap-5'>
                        <FormField
                            control={form.control}
                            name='code'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            type='text'
                                            placeholder='WELCOME10'
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='description'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input type='text' placeholder='Internal note (not shown to customers)' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </Section>

                <Section title='Discount' hint='Percentage off or a fixed money amount.'>
                    <div className='grid md:grid-cols-3 gap-5'>
                        <FormField
                            control={form.control}
                            name='discountType'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type <span className='text-red-500'>*</span></FormLabel>
                                    <Select
                                        options={DISCOUNT_TYPE_OPTIONS}
                                        selected={field.value}
                                        setSelected={(v) => field.onChange(v)}
                                        isMulti={false}
                                        placeholder='Pick a type'
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='discountValue'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{discountType === 'fixed' ? 'Amount (₹)' : 'Percentage (%)'} <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl>
                                        <Input type='number' min='0' step='1' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {discountType === 'percentage' && (
                            <FormField
                                control={form.control}
                                name='maxDiscountAmount'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max discount cap (optional)</FormLabel>
                                        <FormControl>
                                            <Input type='number' min='0' step='1' placeholder='Leave blank for no cap' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </Section>

                <Section title='Validity' hint='When this coupon can be redeemed.'>
                    <div className='grid md:grid-cols-3 gap-5'>
                        <FormField
                            control={form.control}
                            name='startsAt'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Starts</FormLabel>
                                    <FormControl><Input type='date' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='endsAt'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ends <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl><Input type='date' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='status'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        options={STATUS_OPTIONS}
                                        selected={field.value}
                                        setSelected={(v) => field.onChange(v)}
                                        isMulti={false}
                                        placeholder='Pick status'
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='grid md:grid-cols-2 gap-5 mt-4'>
                        <FormField
                            control={form.control}
                            name='automatic'
                            render={({ field }) => (
                                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                                    <div className='space-y-0.5'>
                                        <FormLabel className='font-medium'>Automatic</FormLabel>
                                        <p className='text-xs text-gray-500'>Apply this coupon without requiring a code (reserved for a future cart-side rule).</p>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='stackable'
                            render={({ field }) => (
                                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                                    <div className='space-y-0.5'>
                                        <FormLabel className='font-medium'>Stackable</FormLabel>
                                        <p className='text-xs text-gray-500'>Can be combined with other discounts.</p>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </Section>

                <Section title='Order requirements' hint='Conditions an order must meet to qualify.'>
                    <FormField
                        control={form.control}
                        name='minOrderValue'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Minimum order value (₹)</FormLabel>
                                <FormControl><Input type='number' min='0' step='1' {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Section>

                <Section title='Usage limits' hint='Caps so a code can not be over-redeemed.'>
                    <div className='grid md:grid-cols-3 gap-5'>
                        <FormField
                            control={form.control}
                            name='usageLimit'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total uses (optional)</FormLabel>
                                    <FormControl><Input type='number' min='0' step='1' placeholder='Unlimited' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='usagePerUser'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Per customer (optional)</FormLabel>
                                    <FormControl><Input type='number' min='0' step='1' placeholder='Unlimited' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='firstOrderOnly'
                            render={({ field }) => (
                                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                                    <div className='space-y-0.5'>
                                        <FormLabel className='font-medium'>First order only</FormLabel>
                                        <p className='text-xs text-gray-500'>Customer must have zero prior paid orders.</p>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </Section>

                <Section title='Scope' hint='Which items qualify. Empty pickers ⇒ "all".'>
                    <div className='space-y-5'>
                        <FormField
                            control={form.control}
                            name='applicableCategories'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Applicable categories</FormLabel>
                                    <Select
                                        options={categoryOptions}
                                        selected={field.value}
                                        setSelected={(arr) => field.onChange(arr)}
                                        isMulti={true}
                                        placeholder='All categories'
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='space-y-2'>
                            <FormLabel>Find products (search by name)</FormLabel>
                            <Input
                                placeholder='Type at least 2 characters to search…'
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name='applicableProducts'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Applicable products</FormLabel>
                                    <Select
                                        options={productOptions}
                                        selected={field.value}
                                        setSelected={(arr) => field.onChange(arr)}
                                        isMulti={true}
                                        placeholder='Search above, then pick'
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='excludedProducts'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Excluded products</FormLabel>
                                    <Select
                                        options={productOptions}
                                        selected={field.value}
                                        setSelected={(arr) => field.onChange(arr)}
                                        isMulti={true}
                                        placeholder='Search above, then pick'
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </Section>

                <Section title='Targeting' hint='Which customers can use this. Empty ⇒ everyone.'>
                    <FormField
                        control={form.control}
                        name='customerGroups'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer groups</FormLabel>
                                <Select
                                    options={groupOptions}
                                    selected={field.value}
                                    setSelected={(arr) => field.onChange(arr)}
                                    isMulti={true}
                                    placeholder='Everyone'
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Section>

                <div>
                    <ButtonLoading loading={loading} type='submit' text={submitLabel} className='cursor-pointer' />
                </div>
            </form>
        </Form>
    )
}

export default CouponForm
