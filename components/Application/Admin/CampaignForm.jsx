'use client'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import slugify from 'slugify'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Select from '@/components/Application/Select'
import useFetch from '@/hooks/useFetch'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/)

const schema = z.object({
    name: z.string().trim().min(2, 'Name is required'),
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and dashes'),
    description: z.string().trim().optional().default(''),
    type: z.enum(['promo', 'email', 'banner', 'mixed']),
    startsAt: z.string().min(1, 'Start date required'),
    endsAt: z.string().min(1, 'End date required'),
    status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']),
    targeting: z.object({
        allCustomers: z.boolean().default(true),
        customerGroups: z.array(objectId).default([]),
        firstOrderOnly: z.boolean().default(false),
    }),
    coupons: z.array(objectId).default([]),
})

const TYPE_OPTIONS = [
    { value: 'promo', label: 'Promo (storefront)' },
    { value: 'email', label: 'Email campaign' },
    { value: 'banner', label: 'Site banner' },
    { value: 'mixed', label: 'Mixed' },
]
const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
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

const toDateInput = (v) => v ? new Date(v).toISOString().slice(0, 10) : ''

const CampaignForm = ({ initial = {}, submitLabel = 'Save campaign', onSubmit, loading }) => {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initial.name || '',
            slug: initial.slug || '',
            description: initial.description || '',
            type: initial.type || 'promo',
            startsAt: toDateInput(initial.startsAt),
            endsAt: toDateInput(initial.endsAt),
            status: initial.status || 'draft',
            targeting: {
                allCustomers: initial.targeting?.allCustomers ?? true,
                customerGroups: (initial.targeting?.customerGroups || []).map((x) => String(x?._id || x)),
                firstOrderOnly: initial.targeting?.firstOrderOnly ?? false,
            },
            coupons: (initial.coupons || []).map((c) => String(c?._id || c)),
        },
    })

    const { data: groupData } = useFetch('/api/admin/customer-groups')
    const liveGroupOptions = useMemo(
        () => (groupData?.data || []).map((g) => ({ value: String(g._id), label: g.name })),
        [groupData],
    )

    const { data: couponData } = useFetch('/api/coupon?start=0&size=200&filters=[]&sorting=[]&deleteType=SD')
    const liveCouponOptions = useMemo(() => (couponData?.data || []).map((c) => ({
        value: String(c._id),
        label: `${c.code} · ${c.discountType === 'fixed' ? '₹' + c.discountValue : (c.discountValue || 0) + '%'}`,
    })), [couponData])

    // Seed pickers with the campaign's currently-linked refs so badges
    // show real labels even before / when the live fetches don't
    // include them (deleted, paginated past, or just not yet loaded).
    const seedFromObjs = (arr, fmt) => (arr || [])
        .filter((x) => x && typeof x === 'object' && x._id)
        .map((x) => ({ value: String(x._id), label: fmt(x) }))
    const mergeOptions = (live, seed) => {
        const seen = new Set(live.map((o) => o.value))
        return [...live, ...seed.filter((s) => !seen.has(s.value))]
    }
    const groupOptions = useMemo(
        () => mergeOptions(liveGroupOptions, seedFromObjs(initial?.targeting?.customerGroups, (g) => g.name)),
        [liveGroupOptions, initial?.targeting?.customerGroups],
    )
    const couponOptions = useMemo(
        () => mergeOptions(
            liveCouponOptions,
            seedFromObjs(initial?.coupons, (c) => `${c.code} · ${c.discountType === 'fixed' ? '₹' + c.discountValue : (c.discountValue || 0) + '%'}`),
        ),
        [liveCouponOptions, initial?.coupons],
    )

    const handleSubmit = async (values) => {
        await onSubmit({ ...values, slug: slugify(values.slug, { lower: true, strict: true }) })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-5'>
                <Section title='Campaign'>
                    <div className='grid md:grid-cols-2 gap-5'>
                        <FormField control={form.control} name='name' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name <span className='text-red-500'>*</span></FormLabel>
                                <FormControl>
                                    <Input {...field} onChange={(e) => {
                                        field.onChange(e.target.value)
                                        if (!form.getValues('slug')) {
                                            form.setValue('slug', slugify(e.target.value, { lower: true, strict: true }))
                                        }
                                    }} placeholder='Diwali Sale 2026' />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name='slug' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Slug <span className='text-red-500'>*</span></FormLabel>
                                <FormControl><Input placeholder='diwali-sale-2026' {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className='mt-4'>
                        <FormField control={form.control} name='description' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder='Internal notes — what this campaign is about, what success looks like.' {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </Section>

                <Section title='Type & schedule'>
                    <div className='grid md:grid-cols-2 gap-5'>
                        <FormField control={form.control} name='type' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select options={TYPE_OPTIONS} selected={field.value} setSelected={field.onChange} isMulti={false} />
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name='status' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select options={STATUS_OPTIONS} selected={field.value} setSelected={field.onChange} isMulti={false} />
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name='startsAt' render={({ field }) => (
                            <FormItem><FormLabel>Starts <span className='text-red-500'>*</span></FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name='endsAt' render={({ field }) => (
                            <FormItem><FormLabel>Ends <span className='text-red-500'>*</span></FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </Section>

                <Section title='Targeting' hint='Audience for this campaign.'>
                    <FormField control={form.control} name='targeting.allCustomers' render={({ field }) => (
                        <FormItem className='flex items-center justify-between rounded-md border p-3'>
                            <div className='space-y-0.5'>
                                <FormLabel className='font-medium'>All customers</FormLabel>
                                <p className='text-xs text-gray-500'>When on, customer-group restrictions are ignored.</p>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <div className='mt-4'>
                        <FormField control={form.control} name='targeting.customerGroups' render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer groups (used when "All customers" is off)</FormLabel>
                                <Select options={groupOptions} selected={field.value} setSelected={field.onChange} isMulti={true} placeholder='Pick groups' />
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className='mt-4'>
                        <FormField control={form.control} name='targeting.firstOrderOnly' render={({ field }) => (
                            <FormItem className='flex items-center justify-between rounded-md border p-3'>
                                <div className='space-y-0.5'>
                                    <FormLabel className='font-medium'>First-order customers only</FormLabel>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                </Section>

                <Section title='Linked coupons' hint='Coupons that are part of this campaign.'>
                    <FormField control={form.control} name='coupons' render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coupons</FormLabel>
                            <Select options={couponOptions} selected={field.value} setSelected={field.onChange} isMulti={true} placeholder='Pick coupons' />
                            <FormMessage />
                        </FormItem>
                    )} />
                </Section>

                <div><ButtonLoading loading={loading} type='submit' text={submitLabel} className='cursor-pointer' /></div>
            </form>
        </Form>
    )
}

export default CampaignForm
