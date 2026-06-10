'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'

const formSchema = z.object({
    label: z.string().max(50).optional().default(''),
    fullName: z.string().max(120).optional().default(''),
    phone: z.string().min(7, 'Phone is required.'),
    line1: z.string().min(3, 'Address line 1 is required.'),
    line2: z.string().optional().default(''),
    landmark: z.string().optional().default(''),
    city: z.string().min(2, 'City is required.'),
    state: z.string().min(2, 'State is required.'),
    country: z.string().min(2, 'Country is required.'),
    pincode: z.string().min(3, 'Pincode is required.'),
})

// Plain HTML elements used intentionally to avoid shadcn Input's purple focus-ring
// (focus-visible:ring-ring/50) which cannot be overridden per-instance without
// touching global component files that would affect the admin panel.
const inputCls = 'w-full h-11 bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 px-3 text-sm outline-none focus:border-[#F0D77C] transition-colors'
const textareaCls = 'w-full bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 px-3 py-2 text-sm outline-none focus:border-[#F0D77C] transition-colors resize-none'
const labelCls = 'text-[#F0D77C]/80 text-[10px] uppercase tracking-[0.3em] font-medium'

const AddressForm = ({ initialValues, onSubmit, loading, submitLabel = 'Save address' }) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            label: '', fullName: '', phone: '', line1: '', line2: '',
            landmark: '', city: '', state: '', country: '', pincode: '',
            ...initialValues,
        },
    })

    useEffect(() => {
        if (initialValues) {
            form.reset({
                label: '', fullName: '', phone: '', line1: '', line2: '',
                landmark: '', city: '', state: '', country: '', pincode: '',
                ...initialValues,
            })
        }
    }, [initialValues])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='grid md:grid-cols-2 grid-cols-1 gap-4'>

                <FormField control={form.control} name="label" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Label</FormLabel>
                        <FormControl>
                            <input placeholder="Home, Office…" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Recipient name</FormLabel>
                        <FormControl>
                            <input placeholder="Full name" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Phone <span className='text-[#C9A24B]'>*</span></FormLabel>
                        <FormControl>
                            <input placeholder="+91-XXXXX-XXXXX" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Pincode <span className='text-[#C9A24B]'>*</span></FormLabel>
                        <FormControl>
                            <input placeholder="Postal / ZIP code" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <div className='md:col-span-2'>
                    <FormField control={form.control} name="line1" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Address line 1 <span className='text-[#C9A24B]'>*</span></FormLabel>
                            <FormControl>
                                <textarea placeholder="House / building / street" rows={2} className={textareaCls} {...field} />
                            </FormControl>
                            <FormMessage className='text-red-400 text-xs' />
                        </FormItem>
                    )} />
                </div>

                <div className='md:col-span-2'>
                    <FormField control={form.control} name="line2" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelCls}>Address line 2</FormLabel>
                            <FormControl>
                                <input placeholder="Apartment / suite / unit (optional)" className={inputCls} {...field} />
                            </FormControl>
                            <FormMessage className='text-red-400 text-xs' />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="landmark" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Landmark</FormLabel>
                        <FormControl>
                            <input placeholder="Nearby landmark (optional)" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>City <span className='text-[#C9A24B]'>*</span></FormLabel>
                        <FormControl>
                            <input placeholder="City" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>State <span className='text-[#C9A24B]'>*</span></FormLabel>
                        <FormControl>
                            <input placeholder="State / province" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                        <FormLabel className={labelCls}>Country <span className='text-[#C9A24B]'>*</span></FormLabel>
                        <FormControl>
                            <input placeholder="Country" className={inputCls} {...field} />
                        </FormControl>
                        <FormMessage className='text-red-400 text-xs' />
                    </FormItem>
                )} />

                <div className='md:col-span-2 pt-2 border-t border-[#C9A24B]/20 mt-2'>
                    <ButtonLoading
                        loading={loading}
                        type="submit"
                        text={submitLabel}
                        className="btn-gold uppercase text-[11px] tracking-[0.3em] font-bold px-8 py-3 cursor-pointer w-full md:w-auto"
                    />
                </div>

            </form>
        </Form>
    )
}

export default AddressForm
